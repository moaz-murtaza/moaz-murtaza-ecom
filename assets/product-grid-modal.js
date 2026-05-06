class ProductGridModal {
  constructor() {
    this.currentProduct = null;
    this.selectedVariants = {};
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
  }

  async openProductModal(productItem) {
    const productId = productItem.dataset.productId;
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
    if (image && product.featured_image) {
      image.src = product.featured_image.src;
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

    // Get unique option names with fallback
    const optionNames = (product.options || []).map(opt => opt.name).filter(Boolean);
    if (!optionNames.length) return;

    // Create variant groups for each option
    optionNames.forEach((optionName, optionIndex) => {
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

      // First option as button group (Color style), other options as dropdown
      if (optionIndex === 0) {
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'variant-group__options';

        uniqueValues.forEach((value, valueIndex) => {
          const button = document.createElement('button');
          button.className = 'variant-option';
          button.type = 'button';
          button.textContent = value;
          button.dataset.optionName = optionName;
          button.dataset.optionValue = value;

          button.addEventListener('click', (e) => {
            e.preventDefault();
            optionsContainer.querySelectorAll('[data-option-name="' + optionName + '"]').forEach(btn => {
              btn.classList.remove('active');
            });
            button.classList.add('active');
            this.selectedVariants[optionName] = value;
          });

          if (valueIndex === 0) {
            button.classList.add('active');
            this.selectedVariants[optionName] = value;
          }

          optionsContainer.appendChild(button);
        });

        group.appendChild(optionsContainer);
      } else {
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'variant-group__select-wrapper';

        const select = document.createElement('select');
        select.className = 'variant-group__select';
        select.dataset.optionName = optionName;

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = `Choose your ${optionName.toLowerCase()}`;
        placeholder.selected = true;
        select.appendChild(placeholder);

        uniqueValues.forEach(value => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.appendChild(option);
        });

        select.addEventListener('change', () => {
          this.selectedVariants[optionName] = select.value;
        });

        const arrow = document.createElement('span');
        arrow.className = 'variant-group__select-arrow';
        arrow.setAttribute('aria-hidden', 'true');

        selectWrapper.appendChild(select);
        selectWrapper.appendChild(arrow);
        group.appendChild(selectWrapper);
      }

      variantsContainer.appendChild(group);
    });
  }

  addToCart(modal) {
    if (!this.currentProduct) return;

    const product = this.currentProduct.product;
    
    // Find matching variant based on selected options
    let selectedVariant = null;
    
    if (Object.keys(this.selectedVariants).length === 0) {
      // No variants selected, use first available
      selectedVariant = product.variants[0];
    } else {
      // Find variant matching selected options
      selectedVariant = product.variants.find(variant => {
        return (product.options || []).every((option, index) => {
          const optionName = option.name;
          return this.selectedVariants[optionName] === this.getVariantOptionValue(variant, index);
        });
      });
    }

    if (!selectedVariant) {
      alert('Please select all required options');
      return;
    }

    // Prepare cart items array
    const cartItems = [
      {
        id: selectedVariant.id,
        quantity: 1
      }
    ];

    // Cross-sell logic: If Black and Medium variants are selected, add "Soft Winter Jacket"
    if (this.shouldAddCrossSell()) {
      const crossSellProduct = this.getCrossSellProduct(product);
      if (crossSellProduct && crossSellProduct.id) {
        cartItems.push({
          id: crossSellProduct.id,
          quantity: 1
        });
      }
    }

    // Add to cart
    this.addItemsToCart(cartItems, modal);
  }

  getVariantOptionValue(variant, optionIndex) {
    if (!variant) return '';
    if (Array.isArray(variant.options) && variant.options.length > optionIndex) {
      return variant.options[optionIndex];
    }

    const key = `option${optionIndex + 1}`;
    return variant[key] || '';
  }

  shouldAddCrossSell() {
    // Check if both "Black" and "Medium" are selected
    const hasBlack = Object.values(this.selectedVariants).some(val => val === 'Black');
    const hasMedium = Object.values(this.selectedVariants).some(val => val === 'Medium');
    
    return hasBlack && hasMedium;
  }

  getCrossSellProduct(currentProduct) {
    // Find "Soft Winter Jacket" product
    // This searches for a product with the title containing "Soft Winter Jacket"
    // In a real scenario, you'd fetch all products or have this configured
    const crossSellHandle = 'soft-winter-jacket';
    
    // For now, we'll return this configuration
    // You can modify this to fetch dynamically if needed
    return {
      id: null,
      handle: crossSellHandle
    };
  }

  async addItemsToCart(items, modal) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const cart = await response.json();
      
      // Close modal
      this.closeModal(modal || document.querySelector('.product-detail-modal.active'));

      // Show success message
      this.showCartNotification(items.length);

      // Optionally redirect to cart or update cart UI
      // window.location.href = '/cart';
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart. Please try again.');
    }
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
  }

  formatPrice(price) {
    // Convert cents to dollars and format
    const dollars = (price / 100).toFixed(2);
    return `$${dollars}`;
  }

  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
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
