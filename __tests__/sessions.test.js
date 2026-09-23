const request = require('supertest');
const app = require('../app');
const { User, Sport, Session, SessionPlayer } = require('../models');
const { cleanDatabase, closeDatabase } = require('./setup');

describe('Player Sessions & Join Rules Suite', () => {
  let player1Agent;
  let player2Agent;
  let player1;
  let player2;
  let sport;

  beforeEach(async () => {
    await cleanDatabase();

    player1 = await User.create({
      first_name: 'PlayerOne',
      email: 'p1@test.com',
      password: 'password123',
      role: 'player'
    });

    player2 = await User.create({
      first_name: 'PlayerTwo',
      email: 'p2@test.com',
      password: 'password123',
      role: 'player'
    });

    sport = await Sport.create({
      title: 'Soccer',
      description: 'Outdoor game'
    });

    player1Agent = request.agent(app);
    await player1Agent
      .post('/login')
      .type('form')
      .send({ email: 'p1@test.com', password: 'password123' });

    player2Agent = request.agent(app);
    await player2Agent
      .post('/login')
      .type('form')
      .send({ email: 'p2@test.com', password: 'password123' });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('should block session creation with missing venue or date', async () => {
    const res = await player1Agent
      .post('/sessions')
      .type('form')
      .send({
        sport_id: sport.id,
        date: '',
        time: '',
        venue: '',
        max_players: 10
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/sessions/new');

    const sessions = await Session.findAll();
    expect(sessions.length).toBe(0);
  });

  it('should allow player to create a session and auto-enroll creator as first player', async () => {
    const res = await player1Agent
      .post('/sessions')
      .type('form')
      .send({
        sport_id: sport.id,
        date: '2026-10-15',
        time: '18:00',
        venue: 'Metro Field',
        max_players: 8
      });

    expect(res.status).toBe(302);

    const session = await Session.findOne({ where: { venue: 'Metro Field' } });
    expect(session).not.toBeNull();
    expect(session.creator_id).toBe(player1.id);

    const joins = await SessionPlayer.findAll({ where: { session_id: session.id } });
    expect(joins.length).toBe(1);
    expect(joins[0].user_id).toBe(player1.id);
  });

  it('should prevent duplicate joins by the same player', async () => {
    // Player 1 creates session
    const session = await Session.create({
      sport_id: sport.id,
      creator_id: player1.id,
      date: '2026-10-20',
      time: '17:00',
      venue: 'City Stadium',
      max_players: 10
    });
    await SessionPlayer.create({ session_id: session.id, user_id: player1.id });

    // Player 2 joins for the first time
    const firstJoinRes = await player2Agent
      .post(`/sessions/${session.id}/join`)
      .send();

    expect(firstJoinRes.status).toBe(302);

    let joins = await SessionPlayer.findAll({ where: { session_id: session.id } });
    expect(joins.length).toBe(2);

    // Player 2 attempts duplicate join
    const secondJoinRes = await player2Agent
      .post(`/sessions/${session.id}/join`)
      .send();

    expect(secondJoinRes.status).toBe(302);

    // Verify player count is STILL 2 (no duplicate row in database)
    joins = await SessionPlayer.findAll({ where: { session_id: session.id } });
    expect(joins.length).toBe(2);
  });

  it('should prevent non-creators from cancelling someone elses session', async () => {
    const session = await Session.create({
      sport_id: sport.id,
      creator_id: player1.id,
      date: '2026-10-22',
      time: '19:00',
      venue: 'North Arena',
      max_players: 10
    });

    // Player 2 attempts to cancel Player 1's session
    const res = await player2Agent
      .post(`/sessions/${session.id}/cancel`)
      .send();

    expect(res.status).toBe(403);

    // Session must still exist in DB
    const stillExists = await Session.findByPk(session.id);
    expect(stillExists).not.toBeNull();
  });

  it('should allow the creator to cancel their own session', async () => {
    const session = await Session.create({
      sport_id: sport.id,
      creator_id: player1.id,
      date: '2026-10-25',
      time: '14:00',
      venue: 'East Court',
      max_players: 10
    });

    const res = await player1Agent
      .post(`/sessions/${session.id}/cancel`)
      .send();

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/sessions');

    const check = await Session.findByPk(session.id);
    expect(check).toBeNull();
  });

  it('should search sessions by sport name or venue', async () => {
    const tennis = await Sport.create({ title: 'Tennis', description: 'Racket game' });
    await Session.create({
      sport_id: tennis.id,
      creator_id: player1.id,
      date: '2026-11-01',
      time: '10:00',
      venue: 'Wimbledon Center Court',
      max_players: 4
    });

    const searchRes = await player1Agent.get('/sessions?search=Tennis');
    expect(searchRes.status).toBe(200);
    expect(searchRes.text).toContain('Wimbledon Center Court');
    expect(searchRes.text).toContain('Tennis');
  });

  it('should strictly separate hosted matches and joined matches', async () => {
    // Player 1 hosts a session
    const session = await Session.create({
      sport_id: sport.id,
      creator_id: player1.id,
      date: '2026-11-10',
      time: '18:00',
      venue: 'Separation Arena',
      max_players: 10
    });
    // Creator is on roster
    await SessionPlayer.create({ session_id: session.id, user_id: player1.id });

    // Player 2 joins Player 1's session
    await SessionPlayer.create({ session_id: session.id, user_id: player2.id });

    // 1. Player 1 checks "Joined Matches" (filter=joined) -> should NOT include the match they hosted
    const p1JoinedRes = await player1Agent.get('/sessions?filter=joined');
    expect(p1JoinedRes.status).toBe(200);
    expect(p1JoinedRes.text).not.toContain('Separation Arena');

    // 2. Player 1 checks "Hosted By Me" (filter=my) -> SHOULD include the match
    const p1HostedRes = await player1Agent.get('/sessions?filter=my');
    expect(p1HostedRes.status).toBe(200);
    expect(p1HostedRes.text).toContain('Separation Arena');

    // 3. Player 2 checks "Joined Matches" (filter=joined) -> SHOULD include Player 1's match
    const p2JoinedRes = await player2Agent.get('/sessions?filter=joined');
    expect(p2JoinedRes.status).toBe(200);
    expect(p2JoinedRes.text).toContain('Separation Arena');
  });

  it('should support dedicated /sessions/my and /sessions/joined routes', async () => {
    const myRes = await player1Agent.get('/sessions/my');
    expect(myRes.status).toBe(302);
    expect(myRes.headers.location).toContain('filter=my');

    const joinedRes = await player1Agent.get('/sessions/joined');
    expect(joinedRes.status).toBe(302);
    expect(joinedRes.headers.location).toContain('filter=joined');
  });

  it('should block joining a session when registration deadline has passed', async () => {
    // Session whose closing deadline was yesterday
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const session = await Session.create({
      sport_id: sport.id,
      creator_id: player1.id,
      date: '2026-12-01',
      time: '18:00',
      venue: 'Closed Deadline Arena',
      max_players: 10,
      registration_deadline: yesterday
    });

    const joinRes = await player2Agent
      .post(`/sessions/${session.id}/join`)
      .send();

    expect(joinRes.status).toBe(302);

    // Player 2 should not be added to SessionPlayers
    const joined = await SessionPlayer.findOne({
      where: { session_id: session.id, user_id: player2.id }
    });
    expect(joined).toBeNull();
  });
});
