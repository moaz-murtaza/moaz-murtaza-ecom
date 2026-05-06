class ProductGridModal {
  constructor() {
    this.currentProduct = null;
    this.selectedVariants = {};
    this.activeDropdown = null;
    this.crossSellVariantCache = new Map();
    // Soft Winter Jacket cross-sell variant id (provided by you)
    this.crossSellVariantId = 10206039474471;
    this.init();
  }

  init() {
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Product card click handlers
    const productItems = document.querySelectorAll('.product-grid-modal__item');
    productItems.forEach(item => {
      const openBtn = item.querySelector('.product-grid-modal__open-btn');
      if (openBtn) {
        openBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openProductModal(item);
        });
      }
      // Also allow clicking on the card itself
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.product-grid-modal__open-btn')) {
          this.openProductModal(item);
        }
      });
    });

    // Modal close handlers
    const modals = document.querySelectorAll('.product-detail-modal');
    modals.forEach(modal => {
      const closeBtn = modal.querySelector('.product-detail-modal__close');
      const overlay = modal.querySelector('.product-detail-modal__overlay');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modal));
      }
      
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            this.closeModal(modal);
          }
        });
      }
    });

    // Add to cart button handler
    const addToCartButtons = document.querySelectorAll('[data-modal-add-to-cart]');
    addToCartButtons.forEach(addToCartBtn => {
      addToCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = addToCartBtn.closest('.product-detail-modal');
        this.addToCart(modal);
      });
    });

    // Global click: close any open dropdown
    document.addEventListener('click', (e) => {
      if (!this.activeDropdown) return;
      if (e.target.closest('.variant-dropdown')) return;
      this.closeDropdown(this.activeDropdown);
    });

    // Escape closes dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this.activeDropdown) this.closeDropdown(this.activeDropdown);
    });
  }

  async openProductModal(productItem) {
    const productHandle = productItem.dataset.productHandle;

    try {
      // Fetch product data
      const productData = await this.fetchProductData(productHandle);
      
      // Store current product info
      this.currentProduct = productData;
      this.selectedVariants = {};
      
      // Get modal in the same section
      const section = productItem.closest('[data-section-id]');
      const sectionId = section ? section.dataset.sectionId : null;
      const modal = sectionId
        ? document.querySelector(`.product-detail-modal[data-modal-id="${sectionId}"]`)
        : document.querySelector('.product-detail-modal');
      if (!modal) {
        console.error('Modal not found');
        return;
      }

      // Populate modal with product data
      this.populateModal(modal, productData);
      
      // Show modal
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  }

  async fetchProductData(productHandle) {
    const response = await fetch(`/products/${productHandle}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    return response.json();
  }

  populateModal(modal, productData) {
    const product = productData.product;

    // Update image
    const image = modal.querySelector('[data-modal-image]');
    if (image) {
      image.src = this.getProductImageUrl(product);
      image.alt = product.title;
    }

    // Update title
    const title = modal.querySelector('[data-modal-title]');
    if (title) {
      title.textContent = product.title;
    }

    // Update price
    const priceElement = modal.querySelector('[data-modal-price]');
    if (priceElement && product.variants.length > 0) {
      const price = product.variants[0].price;
      const compareAtPrice = product.variants[0].compare_at_price;
      
      let priceHtml = '';
      if (compareAtPrice) {
        priceHtml = `<span class="price-compare">${this.formatPrice(compareAtPrice)}</span>`;
      }
      priceHtml += `<span class="price">${this.formatPrice(price)}</span>`;
      priceElement.innerHTML = priceHtml;
    }

    // Update description
    const description = modal.querySelector('[data-modal-description]');
    if (description) {
      description.textContent = product.body_html ? this.stripHtml(product.body_html) : '';
    }

    // Render variants
    this.renderVariants(modal, product);
  }

  renderVariants(modal, product) {
    const variantsContainer = modal.querySelector('[data-modal-variants]');
    if (!variantsContainer) return;

    variantsContainer.innerHTML = '';

    // Get option definitions and force UI order: Color -> Size -> remaining
    const options = (product.options || []).filter(opt => opt && opt.name);
    if (!options.length) return;
    const getRoleRank = (optionName) => {
      const role = this.getOptionRole(optionName);
      if (role === 'color') return 0;
      if (role === 'size') return 1;
      return 2;
    };
    const orderedOptions = [...options]
      .map((opt, idx) => ({ ...opt, _index: idx }))
      .sort((a, b) => getRoleRank(a.name) - getRoleRank(b.name) || a._index - b._index);

    // Create variant groups for each option
    orderedOptions.forEach((option) => {
      const optionName = option.name;
      const optionIndex = option._index;
      const uniqueValues = [
        ...new Set(
          (product.variants || [])
            .map(variant => this.getVariantOptionValue(variant, optionIndex))
            .filter(Boolean)
        )
      ];
      if (!uniqueValues.length) return;

      // Render variant group
      const group = document.createElement('div');
      group.className = 'variant-group';
      group.innerHTML = `<label class="variant-group__label">${optionName}</label>`;
      const optionRole = this.getOptionRole(optionName);

      // Color as radio-style buttons with left border, size as dropdown.
      if (optionRole === 'color') {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'variant-group__color-options';
        optionsContainer.setAttribute('role', 'radiogroup');
        optionsContainer.setAttribute('aria-label', optionName);

        const indicator = document.createElement('div');
        indicator.className = 'variant-group__color-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        optionsContainer.appendChild(indicator);

        uniqueValues.forEach((value) => {
          const button = document.createElement('button');
          button.className = 'variant-option variant-option--color';
          button.type = 'button';
          button.textContent = value;
          button.dataset.optionName = optionName;
          button.dataset.optionValue = value;
          button.setAttribute('data-color', value.toLowerCase());
          button.setAttribute('role', 'radio');
          button.setAttribute('aria-checked', 'false');

          // Set left border color based on the value
          const borderColor = this.getColorValue(value);
          button.style.setProperty('--variant-color', borderColor);

          button.addEventListener('click', (e) => {
            e.preventDefault();
            optionsContainer.querySelectorAll('[data-option-name="' + optionName + '"]').forEach(btn => {
              btn.classList.remove('active');
              btn.setAttribute('aria-checked', 'false');
            });
            button.classList.add('active');
            button.setAttribute('aria-checked', 'true');
            this.selectedVariants[optionName] = value;

            this.updateColorIndicator(optionsContainer, button);
          });

          optionsContainer.appendChild(button);
        });

        group.appendChild(optionsContainer);
      } else {
        const dropdown = document.createElement('div');
        dropdown.className = 'variant-dropdown';
        dropdown.dataset.optionName = optionName;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'variant-dropdown__button';
        button.setAttribute('aria-haspopup', 'listbox');
        button.setAttribute('aria-expanded', 'false');

        const buttonText = document.createElement('span');
        buttonText.className = 'variant-dropdown__text';
        buttonText.textContent = optionRole === 'size'
          ? 'Choose your size'
          : `Choose your ${String(optionName).toLowerCase()}`;

        const arrow = document.createElement('span');
        arrow.className = 'variant-dropdown__arrow';
        arrow.setAttribute('aria-hidden', 'true');

        button.appendChild(buttonText);
        button.appendChild(arrow);

        const list = document.createElement('div');
        list.className = 'variant-dropdown__list';
        list.setAttribute('role', 'listbox');
        list.hidden = true;

        uniqueValues.forEach((value) => {
          const opt = document.createElement('button');
          opt.type = 'button';
          opt.className = 'variant-dropdown__option';
          opt.setAttribute('role', 'option');
          opt.dataset.value = value;
          opt.textContent = value;

          opt.addEventListener('click', (e) => {
            e.preventDefault();
            this.selectedVariants[optionName] = value;
            buttonText.textContent = value;
            this.closeDropdown(dropdown);
          });

          list.appendChild(opt);
        });

        button.addEventListener('click', (e) => {
          e.preventDefault();
          if (dropdown.classList.contains('is-open')) {
            this.closeDropdown(dropdown);
          } else {
            if (this.activeDropdown && this.activeDropdown !== dropdown) {
              this.closeDropdown(this.activeDropdown);
            }
            this.openDropdown(dropdown);
          }
        });

        dropdown.appendChild(button);
        dropdown.appendChild(list);
        group.appendChild(dropdown);
      }

      variantsContainer.appendChild(group);
    });
  }

  async addToCart(modal) {
    if (!this.currentProduct) return;

    const product = this.currentProduct.product;
    
    const productOptions = (product.options || []).filter(o => o && o.name);
    const missing = productOptions
      .map(o => o.name)
      .filter(name => !this.selectedVariants[name]);

    if (missing.length) {
      alert('Please select all required options');
      return;
    }

    // Find variant matching selected options
    const selectedVariant = (product.variants || []).find(variant => {
      return productOptions.every((option, index) => {
        const optionName = option.name;
        return this.selectedVariants[optionName] === this.getVariantOptionValue(variant, index);
      });
    });

    if (!selectedVariant) {
      alert('Please select all required options');
      return;
    }

    const addToCartButton = modal ? modal.querySelector('[data-modal-add-to-cart]') : null;
    if (addToCartButton) addToCartButton.disabled = true;

    try {
      // 1) Always add the main selected variant first.
      await this.addItemsToCart([
        {
          id: selectedVariant.id,
          quantity: 1
        }
      ]);

      // 2) Optionally add cross-sell as a second request so it can't block the main item.
      let addedCount = 1;
      if (this.shouldAddCrossSell()) {
        try {
          const configuredId = Number(this.crossSellVariantId);
          const crossSellVariantId = Number.isFinite(configuredId) && configuredId > 0
            ? configuredId
            : await this.getFirstAvailableVariantIdByHandle('dark-winter-jacket');

          if (crossSellVariantId) {
            await this.addItemsToCart(
              [
                {
                  id: crossSellVariantId,
                  quantity: 1
                }
              ],
              { suppressAlert: true }
            );
            addedCount += 1;
          }
        } catch (error) {
          // If cross-sell fails, still treat the main add as success.
          console.error('Cross-sell add failed:', error);
        }
      }

      this.closeModal(modal || document.querySelector('.product-detail-modal.active'));
      this.showCartNotification(addedCount);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error && error.message ? error.message : 'Error adding item to cart. Please try again.');
    } finally {
      if (addToCartButton) addToCartButton.disabled = false;
    }
  }

  getVariantOptionValue(variant, optionIndex) {
    if (!variant) return '';
    if (Array.isArray(variant.options) && variant.options.length > optionIndex) {
      return variant.options[optionIndex];
    }

    const key = `option${optionIndex + 1}`;
    return variant[key] || '';
  }

  getOptionRole(optionName) {
    const normalized = String(optionName || '').toLowerCase();
    if (/(color|colour)/.test(normalized)) return 'color';
    if (/size/.test(normalized)) return 'size';
    return 'default';
  }

  getProductImageUrl(product) {
    if (!product) return '';

    if (typeof product.featured_image === 'string') {
      return product.featured_image;
    }

    if (product.featured_image && typeof product.featured_image === 'object') {
      return product.featured_image.src || product.featured_image.url || '';
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0].src || product.images[0] || '';
    }

    return '';
  }

  shouldAddCrossSell() {
    // Check if both "Black" and "Medium" are selected (case-insensitive)
    const values = Object.values(this.selectedVariants)
      .map(v => String(v || '').trim().toLowerCase())
      .filter(Boolean);
    const hasBlack = values.includes('black');
    const hasMedium = values.includes('medium') || values.includes('m') || values.includes('med');
    return hasBlack && hasMedium;
  }

  async fetchProductJsonByHandle(handle) {
    const response = await fetch(`/products/${handle}.json`, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Failed to fetch product (${handle}): ${response.statusText}`);
    }
    return response.json();
  }

  async getFirstAvailableVariantIdByHandle(handle) {
    if (!handle) return null;
    if (this.crossSellVariantCache.has(handle)) {
      return this.crossSellVariantCache.get(handle);
    }

    const productData = await this.fetchProductJsonByHandle(handle);
    const product = productData && productData.product;
    const variants = (product && product.variants) || [];
    if (!variants.length) {
      this.crossSellVariantCache.set(handle, null);
      return null;
    }

    const availableVariant = variants.find(v => v && (v.available === true || v.available === 'true'));
    const variantId = (availableVariant || variants[0]).id || null;
    this.crossSellVariantCache.set(handle, variantId);
    return variantId;
  }

  async addItemsToCart(items, { suppressAlert = false } = {}) {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });

    const bodyText = await response.text();
    let bodyJson = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    if (!response.ok) {
      const message =
        (bodyJson && (bodyJson.description || bodyJson.message)) ||
        bodyText ||
        `Failed to add to cart (${response.status})`;

      if (!suppressAlert) {
        // Let the caller decide whether to alert; we throw either way.
        // (Some callers may want a silent failure, e.g., cross-sell.)
      }

      throw new Error(message);
    }

    return bodyJson;
  }

  showCartNotification(itemCount) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #000;
      color: #fff;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      z-index: 1000;
      animation: slideInDown 0.3s ease-out;
      font-size: 0.9rem;
      font-weight: 600;
    `;
    
    const itemWord = itemCount === 1 ? 'item' : 'items';
    notification.textContent = `${itemCount} ${itemWord} added to cart`;
    
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutUp 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset selected variants
    this.selectedVariants = {};
    this.currentProduct = null;

    if (this.activeDropdown) {
      this.closeDropdown(this.activeDropdown);
    }
  }

  openDropdown(dropdown) {
    const list = dropdown.querySelector('.variant-dropdown__list');
    const button = dropdown.querySelector('.variant-dropdown__button');
    if (!list || !button) return;

    dropdown.classList.add('is-open');
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    this.activeDropdown = dropdown;
  }

  closeDropdown(dropdown) {
    const list = dropdown.querySelector('.variant-dropdown__list');
    const button = dropdown.querySelector('.variant-dropdown__button');
    if (!list || !button) return;

    dropdown.classList.remove('is-open');
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');

    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    }
  }

  updateColorIndicator(container, activeButton) {
    const indicator = container.querySelector('.variant-group__color-indicator');
    if (!indicator || !activeButton) return;

    const x = activeButton.offsetLeft;
    const y = activeButton.offsetTop;
    const w = activeButton.offsetWidth;
    const h = activeButton.offsetHeight;

    indicator.style.width = `${w}px`;
    indicator.style.height = `${h}px`;
    indicator.style.transform = `translate(${x}px, ${y}px)`;
    indicator.style.opacity = '1';
  }

  formatPrice(price) {
    if (price === null || price === undefined || price === '') {
      return '$0.00';
    }

    // Shopify /products/{handle}.json commonly returns decimal strings ("30.00").
    if (typeof price === 'string') {
      const parsed = Number(price.replace(/[^0-9.-]/g, ''));
      return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : '$0.00';
    }

    // If numeric and large enough, treat as cents; otherwise treat as dollars.
    if (typeof price === 'number') {
      const normalized = price >= 1000 ? price / 100 : price;
      return `$${normalized.toFixed(2)}`;
    }

    return '$0.00';
  }

  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  getColorValue(colorName) {
    const raw = String(colorName || '').trim();
    if (!raw) return '#000000';

    // If merchant uses direct color values, allow them (hex / rgb / hsl)
    if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
      return raw;
    }
    if (/^(rgb|rgba|hsl|hsla)\(/i.test(raw)) {
      return raw;
    }

    // Map common color names to hex values
    const colorMap = {
      'white': '#FFFFFF',
      'black': '#000000',
      'red': '#EF4444',
      'blue': '#3B82F6',
      'green': '#10B981',
      'yellow': '#FBBF24',
      'purple': '#A855F7',
      'pink': '#EC4899',
      'brown': '#92400E',
      'orange': '#F97316',
      'navy': '#001F3F',
      'beige': '#D4A574',
      'cream': '#FFFDD0',
      'gray': '#808080',
    };
    
    const lowerName = raw.toLowerCase();
    if (colorMap[lowerName]) return colorMap[lowerName];

    // Last resort: if the browser recognizes it as a CSS color keyword, use it.
    // This supports values like "teal", "rebeccapurple", etc.
    const probe = document.createElement('span');
    probe.style.color = '';
    probe.style.color = raw;
    if (probe.style.color) return raw;

    return '#000000';
  }
}

// Add slide animations to stylesheet
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideOutUp {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProductGridModal();
  });
} else {
  new ProductGridModal();
}
