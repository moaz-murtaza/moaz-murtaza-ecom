(() => {
  const initGiftGuideBanner = () => {
    document.querySelectorAll('[data-gift-guide-banner]').forEach((section) => {
      if (section.dataset.giftGuideLoaded === 'true') {
        return;
      }

      section.dataset.giftGuideLoaded = 'true';
      requestAnimationFrame(() => {
        section.classList.add('gift-guide-banner--loaded');
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftGuideBanner, { once: true });
  } else {
    initGiftGuideBanner();
  }
})();
