'use strict';

const { Sport, Session, User, SessionPlayer } = require('../models');

const defaultSports = [
  { title: 'Basketball', description: 'Full court 5-on-5 basketball with standard hoops and shot clock rules.' },
  { title: 'Soccer', description: 'Outdoor turf or grass field football, 11 vs 11 or 7 vs 7 mini league.' },
  { title: 'Tennis', description: 'Singles or doubles match on hard or clay court.' },
  { title: 'Cricket', description: 'T20, box cricket, or nets practice with leather or tennis ball.' },
  { title: 'Badminton', description: 'Fast-paced indoor court singles or doubles racquet matches.' },
  { title: 'Volleyball', description: 'Indoor or beach volleyball matches with standard 6v6 rotation.' },
  { title: 'Table Tennis', description: 'Indoor ping pong singles or doubles showdowns and tournaments.' },
  { title: 'Swimming', description: 'Lap swimming, lane workouts, and friendly timed heat relays.' },
  { title: 'Pickleball', description: 'Exciting paddle sport combining tennis, badminton, and ping-pong.' },
  { title: 'Baseball', description: 'Diamond softball or baseball innings with batting and fielding.' },
  { title: 'Hockey', description: 'Field hockey or turf hockey with fast stickwork and goals.' },
  { title: 'Rugby', description: 'High-energy 7s or 15s rugby union contact scrimmage.' },
  { title: 'Archery', description: 'Target archery competition with recurve and compound bows.' },
  { title: 'Bowling', description: '10-pin indoor bowling alley frames, strikes, and spares.' },
  { title: 'Golf', description: '9-hole or 18-hole scramble and stroke play on local greens.' },
  { title: 'Boxing', description: 'Sparring, ring fitness drills, and amateur weight-class bouts.' },
  { title: 'Martial Arts', description: 'Karate, Taekwondo, and Judo dojo sparring and kata drills.' },
  { title: 'Handball', description: 'Fast-paced court team handball with rapid passing and shooting.' },
  { title: 'Ultimate Frisbee', description: 'Non-contact flying disc team game with end-zone scoring.' },
  { title: 'Snooker & Pool', description: '8-ball, 9-ball, and classic snooker cue sport matches.' },
  { title: 'Cycling', description: 'Road cycling, velodrome sprints, and scenic group trail rides.' },
  { title: 'Rock Climbing', description: 'Indoor bouldering, top-rope routes, and lead climbing sessions.' },
  { title: 'Squash', description: 'High-intensity enclosed four-walled court racquet challenge.' }
];

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function seedDatabase() {
  try {
    // 1. Seed Sports Catalog (23 sports)
    const sportMap = {};
    for (const sportData of defaultSports) {
      const [sport] = await Sport.findOrCreate({
        where: { title: sportData.title },
        defaults: sportData
      });
      sportMap[sport.title] = sport;
    }

    // 2. Ensure a default community organizer exists for hosting initial open games
    const [organizer] = await User.findOrCreate({
      where: { email: 'organizer@sportsscheduler.com' },
      defaults: {
        first_name: 'Jordan',
        last_name: 'Smith',
        email: 'organizer@sportsscheduler.com',
        password: 'Password123!',
        role: 'player'
      }
    });

    // 3. Ensure an admin user exists for sports catalog management
    await User.findOrCreate({
      where: { email: 'admin@test.com' },
      defaults: {
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@test.com',
        password: 'AdminPassword123!',
        role: 'admin'
      }
    });

    // 4. Seed initial active sessions if no sessions exist
    const sessionCount = await Session.count();
    if (sessionCount === 0) {
      const sampleSessions = [
        {
          sportTitle: 'Cricket',
          venue: 'National Cricket Arena - Pitch 2',
          address: '3rd Floor, Smash Sports Center, 12th Main Road, Indiranagar',
          daysAhead: 3,
          time: '16:00:00',
          max_players: 14
        },
        {
          sportTitle: 'Tennis',
          venue: 'VIT Sports Complex - Hard Court',
          address: 'Gate 4, National Stadium Complex, Outer Ring Road',
          daysAhead: 2,
          time: '17:30:00',
          max_players: 8
        },
        {
          sportTitle: 'Badminton',
          venue: 'Smash Indoor Badminton Academy',
          address: 'Court 3 & 4, Smash Sports Arena, Indiranagar',
          daysAhead: 4,
          time: '18:30:00',
          max_players: 4
        },
        {
          sportTitle: 'Volleyball',
          venue: 'Sunset Beach Volleyball Court 1',
          address: 'Sunset Beach Front, Coastal Highway, Beach Arena',
          daysAhead: 6,
          time: '17:00:00',
          max_players: 12
        },
        {
          sportTitle: 'Basketball',
          venue: 'Downtown YMCA Court 3',
          address: 'YMCA Youth Center, 45 Central Avenue, Near Metro Station',
          daysAhead: 5,
          time: '19:00:00',
          max_players: 10
        },
        {
          sportTitle: 'Soccer',
          venue: 'City Turf Arena - Main Pitch',
          address: 'Sector 5 Sports Zone, Near Central Park Arena',
          daysAhead: 7,
          time: '18:00:00',
          max_players: 14
        },
        {
          sportTitle: 'Bowling',
          venue: 'Strike Zone Bowling Alley - Lanes 5-8',
          address: 'Lanes 5-8, Strike Zone Alley, Orion Mall 4th Level',
          daysAhead: 8,
          time: '19:30:00',
          max_players: 8
        },
        {
          sportTitle: 'Archery',
          venue: 'Royal Archery Range - Outdoor Targets',
          address: 'Royal Archers Ground, Green Park Sports Enclave, Sector 7',
          daysAhead: 10,
          time: '11:00:00',
          max_players: 6
        },
        {
          sportTitle: 'Squash',
          venue: 'Downtown Fitness Club - Squash Glass Court',
          address: 'Glass Court 2, Elite Squash Center, 88 Residency Road',
          daysAhead: 9,
          time: '18:00:00',
          max_players: 4
        },
        {
          sportTitle: 'Golf',
          venue: 'Green Valley Golf Links - Hole 1 Tee',
          address: 'Clubhouse Greens, Green Valley Golf Links, Airport Road',
          daysAhead: 12,
          time: '08:00:00',
          max_players: 4
        },
        {
          sportTitle: 'Table Tennis',
          venue: 'Metro Table Tennis Club',
          address: 'Level 2, Sports City Plaza, Downtown',
          daysAhead: 11,
          time: '17:00:00',
          max_players: 4
        },
        {
          sportTitle: 'Swimming',
          venue: 'Aquatic Sports Center - Olympic Pool',
          address: 'East Wing, University Sports Village',
          daysAhead: 13,
          time: '07:00:00',
          max_players: 8
        }
      ];

      for (const item of sampleSessions) {
        const sport = sportMap[item.sportTitle];
        if (sport) {
          const session = await Session.create({
            sport_id: sport.id,
            creator_id: organizer.id,
            date: getFutureDate(item.daysAhead),
            time: item.time,
            venue: item.venue,
            address: item.address,
            max_players: item.max_players
          });

          // Add organizer to session players
          await SessionPlayer.findOrCreate({
            where: { session_id: session.id, user_id: organizer.id }
          });
        }
      }
      console.log('Sample sessions initialized successfully.');
    }

    console.log('Database sports and catalog seeded successfully.');
  } catch (err) {
    console.error('Error seeding default database data:', err);
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, defaultSports };
