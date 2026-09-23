document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach((alert) => {
    const closeBtn = alert.querySelector('.alert-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => alert.remove(), 250);
      });
    }

    setTimeout(() => {
      if (document.body.contains(alert)) {
        alert.style.transition = 'all 0.3s ease';
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';
        setTimeout(() => alert.remove(), 300);
      }
    }, 6000);
  });

  // Generic confirmation for dangerous actions (e.g. canceling a session or deleting sport)
  const confirmActions = document.querySelectorAll('[data-confirm]');
  confirmActions.forEach((el) => {
    el.addEventListener('click', (e) => {
      const message = el.getAttribute('data-confirm') || 'Are you sure you want to perform this action?';
      if (!confirm(message)) {
        e.preventDefault();
      }
    });
  });
});
