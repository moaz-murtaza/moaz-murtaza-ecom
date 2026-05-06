(() => {
  const openMenuDrawer = () => {
    // Prefer clicking Dawn's actual hamburger toggle so its drawer JS runs.
    const details = document.querySelector(
      'header-drawer details#Details-menu-drawer-container, details#Details-menu-drawer-container'
    );

    const summary = details
      ? details.querySelector('summary.header__icon--menu, summary')
      : document.querySelector(
          'header-drawer summary.header__icon--menu, summary.header__icon--menu, .menu-drawer-container > summary'
        );

    if (summary) {
      summary.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
      return;
    }

    // Fallback: open the <details> directly.
    if (details) {
      details.open = true;
      details.setAttribute('open', '');
      return;
    }

    console.warn('[GiftGuideBanner] Menu drawer not found');
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
