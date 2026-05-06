(() => {
  const setNavOpen = (section, isOpen) => {
    const nav = section.querySelector('[data-gift-guide-banner-mobile-nav]');
    const toggle = section.querySelector('[data-gift-guide-banner-menu-toggle]');

    section.classList.toggle('gift-guide-banner--nav-open', isOpen);
    if (nav) nav.hidden = !isOpen;
    if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  const initGiftGuideBanner = () => {
    document.querySelectorAll('[data-gift-guide-banner]').forEach((section) => {
      if (section.dataset.giftGuideLoaded === 'true') {
        return;
      }

      section.dataset.giftGuideLoaded = 'true';
      requestAnimationFrame(() => {
        section.classList.add('gift-guide-banner--loaded');
      });

      const menuToggle = section.querySelector('[data-gift-guide-banner-menu-toggle]');
      if (menuToggle && menuToggle.dataset.giftGuideBound !== 'true') {
        menuToggle.dataset.giftGuideBound = 'true';
        menuToggle.addEventListener('click', (e) => {
          e.preventDefault();
          const isOpen = section.classList.contains('gift-guide-banner--nav-open');
          setNavOpen(section, !isOpen);
        });
      }

      // Start closed.
      setNavOpen(section, false);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftGuideBanner, { once: true });
  } else {
    initGiftGuideBanner();
  }
})();
