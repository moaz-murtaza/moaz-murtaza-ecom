class GiftGuideBanner {
  constructor() {
    this.init();
  }

  init() {
    const buttons = document.querySelectorAll('.gift-guide-banner__button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', this.animateButton.bind(this));
    });
  }

  animateButton(event) {
    const button = event.target.closest('.gift-guide-banner__button');
    if (!button) return;

    // Add animation class
    button.style.animation = 'none';
    setTimeout(() => {
      button.style.animation = '';
    }, 10);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GiftGuideBanner();
  });
} else {
  new GiftGuideBanner();
}
