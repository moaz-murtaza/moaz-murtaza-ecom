(() => {
  const openMenuDrawer = () => {
    const details = document.getElementById('Details-menu-drawer-container');
    if (!details) return;

    const summary = details.querySelector('summary');
    const isOpen = details.hasAttribute('open');

    // Prefer theme's own click handler on summary.
    if (summary) {
      if (!isOpen) summary.click();
      return;
    }

    // Fallback if summary isn't found.
    details.open = true;
  };

  const tryInjectDrawerContent = (section) => {
    const template = section.querySelector('template[data-gift-guide-banner-drawer-template]');
    if (!template) return;

    const drawer = document.getElementById('menu-drawer');
    if (!drawer) return;

    const sectionId = section.getAttribute('data-gift-guide-banner') || '';
    const injectedKey = sectionId ? `giftGuideInjected_${sectionId}` : 'giftGuideInjected';
    if (drawer.dataset[injectedKey] === 'true') return;

    const container =
      drawer.querySelector('.menu-drawer__navigation-container') ||
      drawer.querySelector('.menu-drawer__inner-container') ||
      drawer;

    const fragment = template.content.cloneNode(true);
    container.insertBefore(fragment, container.firstChild);
    drawer.dataset[injectedKey] = 'true';
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
          openMenuDrawer();
        });
      }

      // Inject mobile-only top text/button into the existing header menu drawer.
      // Retry a few times in case the drawer loads after this section.
      for (let i = 0; i < 10; i += 1) {
        setTimeout(() => tryInjectDrawerContent(section), i * 200);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftGuideBanner, { once: true });
  } else {
    initGiftGuideBanner();
  }
})();
