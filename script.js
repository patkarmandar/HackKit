/**
 * The Hacker Kit - Optimized & Production Ready
 * @version 2.0.0
 * Features: Virtual scrolling, keyboard nav, dark mode, favorites, etc.
 */

// State management
const state = {
    selectedTags: new Set(),
    tagsJSON: {},
    dataJSON: [],
    filteredData: [],
    favorites: new Set(),
    recentlyViewed: [],
    darkMode: true,
    viewMode: 'grid', // 'grid' or 'list'
    sortBy: 'name-asc',
    searchTerm: '',
    showStats: false,
    showLegend: false,
    autocompleteIndex: -1,
    focusedCardIndex: -1
};

// Utility functions
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const capitalize = (phrase) =>
    phrase.replace(/_/g, ' ').split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

const cleanURL = (url) => {
    const clean = url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return clean.length <= 45 ? clean : `${clean.slice(0, 20)}...${clean.slice(-15)}`;
};

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { 
        success: 'bi-check-circle-fill', 
        error: 'bi-exclamation-circle-fill', 
        info: 'bi-info-circle-fill' 
    };
    
    toast.innerHTML = `
        <i class="bi ${icons[type]} toast-icon"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// LocalStorage
function loadFromStorage() {
    try {
        const stored = localStorage.getItem('hackerKitData');
        if (stored) {
            const data = JSON.parse(stored);
            state.favorites = new Set(data.favorites || []);
            state.recentlyViewed = data.recentlyViewed || [];
            state.darkMode = data.darkMode !== undefined ? data.darkMode : true;
            state.viewMode = data.viewMode || 'grid';
            updateFavoritesCount();
            updateDarkModeIcon();
            updateViewIcon();
        }
    } catch (e) {
        console.error('Error loading storage:', e);
        // Reset corrupted storage
        localStorage.removeItem('hackerKitData');
    }
}

function saveToStorage() {
    try {
        const data = {
            favorites: Array.from(state.favorites),
            recentlyViewed: state.recentlyViewed.slice(0, 10),
            darkMode: state.darkMode,
            viewMode: state.viewMode
        };
        localStorage.setItem('hackerKitData', JSON.stringify(data));
    } catch (e) {
        console.error('Error saving storage:', e);
    }
}

// Dark mode
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    updateDarkModeIcon();
    saveToStorage();
    showToast(state.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
}

function updateDarkModeIcon() {
    const icon = document.querySelector('#darkModeToggle i');
    if (icon) icon.className = state.darkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

// View mode toggle
function toggleView() {
    state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
    document.getElementById('dataList')?.classList.toggle('list-view', state.viewMode === 'list');
    updateViewIcon();
    saveToStorage();
}

function updateViewIcon() {
    const icon = document.querySelector('#viewToggle i');
    if (icon) icon.className = state.viewMode === 'grid' ? 'bi bi-list-ul' : 'bi bi-grid-3x3-gap-fill';
}

// Favorites
function toggleFavorite(toolName) {
    if (state.favorites.has(toolName)) {
        state.favorites.delete(toolName);
        showToast('Removed from favorites', 'info');
    } else {
        state.favorites.add(toolName);
        showToast('Added to favorites', 'success');
    }
    updateFavoritesCount();
    saveToStorage();
    
    // Update UI
    document.querySelectorAll('.btn-favorite').forEach(btn => {
        if (btn.dataset.name === toolName) {
            btn.classList.toggle('active', state.favorites.has(toolName));
        }
    });
}

function updateFavoritesCount() {
    const favCount = document.getElementById('favCount');
    const count = state.favorites.size;
    if (favCount) {
        favCount.textContent = count;
        favCount.classList.toggle('show', count > 0);
    }
}

function showFavorites() {
    const favBtn = document.getElementById('favoritesToggle');
    const isShowingFavorites = favBtn?.classList.contains('active');
    
    // Toggle favorites mode
    if (isShowingFavorites) {
        // Exit favorites mode - show all tools
        favBtn.classList.remove('active');
        state.selectedTags.clear();
        document.getElementById('search').value = '';
        state.searchTerm = '';
        
        // Clear all active filter buttons
        document.querySelectorAll('#filters button[data-tag]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        filterItems();
        showToast('Showing all tools', 'info');
        return;
    }
    
    // Enter favorites mode
    if (state.favorites.size === 0) {
        showToast('No favorites yet', 'info');
        return;
    }
    
    favBtn?.classList.add('active');
    state.selectedTags.clear();
    document.getElementById('search').value = '';
    state.searchTerm = '';
    
    // Clear all active filter buttons
    document.querySelectorAll('#filters button[data-tag]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    filterItems(tool => state.favorites.has(tool.name));
    showToast(`Showing ${state.favorites.size} favorites`, 'success');
}

// Recently viewed
function addToRecentlyViewed(toolName) {
    state.recentlyViewed = state.recentlyViewed.filter(n => n !== toolName);
    state.recentlyViewed.unshift(toolName);
    state.recentlyViewed = state.recentlyViewed.slice(0, 10);
    updateRecentlyViewed();
    saveToStorage();
}

function updateRecentlyViewed() {
    const container = document.getElementById('recentlyViewed');
    const itemsContainer = document.getElementById('recentItems');
    
    if (!container || !itemsContainer) return;
    
    if (state.recentlyViewed.length > 0) {
        container.style.display = 'block';
        itemsContainer.innerHTML = state.recentlyViewed.map(name =>
            `<a href="#" class="recent-item" data-name="${name}">${name}</a>`
        ).join('');
        
        itemsContainer.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('search').value = item.dataset.name;
                filterItems();
            });
        });
    } else {
        container.style.display = 'none';
    }
}

// Statistics
function calculateStats() {
    const stats = { total: state.dataJSON.length, techniques: {}, categories: {}, targets: {} };
    state.dataJSON.forEach(tool => {
        (tool.techniques || []).forEach(t => stats.techniques[t] = (stats.techniques[t] || 0) + 1);
        (tool.categories || []).forEach(c => stats.categories[c] = (stats.categories[c] || 0) + 1);
        (tool.targets || []).forEach(t => stats.targets[t] = (stats.targets[t] || 0) + 1);
    });
    return stats;
}

function toggleStats() {
    state.showStats = !state.showStats;
    const panel = document.getElementById('statsPanel');
    const grid = document.getElementById('statsGrid');
    const btn = document.getElementById('statsToggle');
    
    if (!panel || !grid) return;
    
    if (btn) btn.classList.toggle('active', state.showStats);
    
    if (state.showStats) {
        const stats = calculateStats();
        const summaryStats = [
            { label: 'Total Techniques', count: Object.keys(stats.techniques).length },
            { label: 'Total Categories', count: Object.keys(stats.categories).length },
            { label: 'Total Targets', count: Object.keys(stats.targets).length },
            { label: 'Total Tools', count: stats.total }
        ];
        
        grid.innerHTML = summaryStats.map(stat => `
            <div class="stat-item">
                <div class="stat-number">${stat.count}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
        
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// Legend
function toggleLegend() {
    state.showLegend = !state.showLegend;
    const panel = document.getElementById('legendPanel');
    const btn = document.getElementById('legendToggle');
    if (panel) panel.style.display = state.showLegend ? 'block' : 'none';
    if (btn) btn.classList.toggle('active', state.showLegend);
}

// Share
async function shareFilters() {
    const params = new URLSearchParams();
    if (state.searchTerm) params.set('q', state.searchTerm);
    if (state.selectedTags.size > 0) params.set('tags', Array.from(state.selectedTags).join(','));
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    
    const shareBtn = document.getElementById('shareBtn');
    const originalIcon = shareBtn?.querySelector('i')?.className;
    
    try {
        await navigator.clipboard.writeText(url);
        if (shareBtn) {
            const icon = shareBtn.querySelector('i');
            if (icon) icon.className = 'bi bi-check2';
            shareBtn.style.background = 'rgba(16, 185, 129, 0.3)';
        }
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => {
            if (shareBtn) {
                const icon = shareBtn.querySelector('i');
                if (icon && originalIcon) icon.className = originalIcon;
                shareBtn.style.background = '';
            }
        }, 2000);
    } catch (e) {
        showToast('Failed to copy link', 'error');
    }
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) document.getElementById('search').value = params.get('q');
    if (params.has('tags')) params.get('tags').split(',').forEach(tag => state.selectedTags.add(tag));
}

// Sorting
function sortTools() {
    const sortBy = document.getElementById('sortSelect')?.value || 'name-asc';
    state.sortBy = sortBy;
    
    state.filteredData.sort((a, b) => {
        switch (sortBy) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'favorites':
                const aFav = state.favorites.has(a.name) ? 1 : 0;
                const bFav = state.favorites.has(b.name) ? 1 : 0;
                if (aFav !== bFav) return bFav - aFav;
                return a.name.localeCompare(b.name);
            default: return 0;
        }
    });
    
    renderFilteredItems();
}

// Autocomplete
function showAutocomplete(query) {
    const dropdown = document.getElementById('autocomplete');
    if (!dropdown || !query || query.length < 2) {
        if (dropdown) dropdown.style.display = 'none';
        return;
    }
    
    const matches = state.dataJSON
        .filter(tool => tool.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
    
    if (matches.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    
    dropdown.innerHTML = matches.map((tool, index) => {
        const highlighted = tool.name.replace(
            new RegExp(query, 'gi'),
            match => `<strong>${match}</strong>`
        );
        return `<div class="autocomplete-item" data-index="${index}" data-name="${tool.name}">${highlighted}</div>`;
    }).join('');
    
    dropdown.style.display = 'block';
    state.autocompleteIndex = -1;
    
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('search').value = item.dataset.name;
            dropdown.style.display = 'none';
            filterItems();
        });
    });
}

const debouncedAutocomplete = debounce(showAutocomplete, 200);

// Active chips
function updateActiveChips() {
    const chipsSection = document.getElementById('activeChips');
    const chipsContainer = chipsSection?.querySelector('.chips-container');
    
    if (!chipsSection || !chipsContainer) return;
    
    if (state.selectedTags.size === 0 && !state.searchTerm) {
        chipsSection.style.display = 'none';
        return;
    }
    
    chipsSection.style.display = 'flex';
    chipsContainer.innerHTML = '';
    
    if (state.searchTerm) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<span>Search: ${state.searchTerm}</span><i class="bi bi-x"></i>`;
        chip.addEventListener('click', () => {
            document.getElementById('search').value = '';
            state.searchTerm = '';
            filterItems();
        });
        chipsContainer.appendChild(chip);
    }
    
    state.selectedTags.forEach(tag => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `<span>${capitalize(tag)}</span><i class="bi bi-x"></i>`;
        chip.addEventListener('click', () => {
            const btn = document.querySelector(`#filters button[data-tag="${tag}"]`);
            if (btn) btn.click();
        });
        chipsContainer.appendChild(chip);
    });
}

// Update results count
function updateResultsCount(visible, total) {
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsCount) {
        resultsCount.innerHTML = `Showing <strong>${visible}</strong> of ${total} tools`;
    }
}

// Data loading
async function loadJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        showToast(`Error loading data: ${error.message}`, 'error');
        throw error;
    }
}

async function initializeApp() {
    try {
        document.getElementById('loadingOverlay')?.classList.remove('hidden');
        loadFromStorage();
        loadFromURL();
        
        const [tags, data] = await Promise.all([loadJSON('tags.json'), loadJSON('data.json')]);
        
        if (tags) {
            state.tagsJSON = tags;
            generateFilters();
        }
        
        if (Array.isArray(data)) {
            state.dataJSON = data;
            state.filteredData = [...data];
            generateList();
        }
        
        document.getElementById('loadingOverlay')?.classList.add('hidden');
        
        if (state.selectedTags.size > 0) {
            state.selectedTags.forEach(tag => {
                const btn = document.querySelector(`button[data-tag="${tag}"]`);
                if (btn) btn.classList.add('active');
            });
            filterItems();
        }
        
        updateRecentlyViewed();
        
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById('loadingOverlay')?.classList.add('hidden');
    }
}

// Render functions
function generateList() {
    renderFilteredItems();
}

function renderFilteredItems() {
    const dataList = document.getElementById('dataList');
    if (!dataList) return;

    dataList.innerHTML = '';

    if (state.filteredData.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        dataList.style.display = 'none';
        return;
    }

    document.getElementById('noResults').style.display = 'none';
    dataList.style.display = 'grid';

    // Render all items (virtual scrolling removed for simplicity with 303 items)
    state.filteredData.forEach((item, index) => {
        const listItem = createListItem(item, index);
        dataList.appendChild(listItem);
    });

    updateResultsCount(state.filteredData.length, state.dataJSON.length);
}

function createListItem(item, index) {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');
    listItem.setAttribute('data-index', index);
    listItem.setAttribute('tabindex', '0');
    listItem.setAttribute('role', 'listitem');
    
    // Category for border color
    if (item.techniques && item.techniques.length > 0) {
        listItem.classList.add('category-primary');
    } else if (item.categories && item.categories.length > 0) {
        listItem.classList.add('category-success');
    } else {
        listItem.classList.add('category-dark');
    }

    const isFavorite = state.favorites.has(item.name);

    listItem.innerHTML = `
        <div class="card-header-actions">
            <div class="title">${item.name || 'Unnamed Tool'}</div>
            <div class="card-actions">
                <button class="btn-card-action btn-favorite ${isFavorite ? 'active' : ''}" 
                        title="Add to favorites" data-name="${item.name}" aria-label="Favorite ${item.name}">
                    <i class="bi bi-star-fill"></i>
                </button>
                <a href="${item.source || item.url}" target="_blank" rel="noopener noreferrer" 
                   class="btn-card-action" title="View Source Code" aria-label="View source for ${item.name}">
                    <i class="bi bi-code-slash"></i>
                </a>
            </div>
        </div>
        <div class="description">${item.description || 'No description available'}</div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" 
               data-name="${item.name}" style="flex: 1;" aria-label="Visit ${item.name}">
                ${cleanURL(item.url || 'No URL')}
                <i class="bi bi-box-arrow-up-right external-icon"></i>
            </a>
            <button class="btn-card-action btn-copy-url" title="Copy URL" 
                    data-url="${item.url}" aria-label="Copy URL for ${item.name}">
                <i class="bi bi-clipboard"></i>
            </button>
        </div>
        <div class="d-flex flex-wrap">${generateTags(item)}</div>
    `;

    // Event listeners
    const favBtn = listItem.querySelector('.btn-favorite');
    if (favBtn) {
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item.name);
        });
    }

    const copyBtn = listItem.querySelector('.btn-copy-url');
    if (copyBtn) {
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const originalIcon = copyBtn.innerHTML;
            try {
                await navigator.clipboard.writeText(copyBtn.dataset.url);
                copyBtn.innerHTML = '<i class="bi bi-check2"></i>';
                copyBtn.style.background = 'var(--success)';
                copyBtn.style.color = 'white';
                copyBtn.style.borderColor = 'var(--success)';
                showToast('URL copied!', 'success');
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                    copyBtn.style.borderColor = '';
                }, 2000);
            } catch (e) {
                showToast('Failed to copy', 'error');
            }
        });
    }

    const link = listItem.querySelector('a[data-name]');
    if (link) {
        link.addEventListener('click', () => addToRecentlyViewed(item.name));
    }

    return listItem;
}

function generateTags(item) {
    let html = '';
    
    if (Array.isArray(item.techniques)) {
        item.techniques.forEach(technique => {
            html += `<span class="alert alert-primary" data-tag="${technique}" tabindex="0" role="button">${capitalize(technique)}</span>`;
        });
    }
    
    if (Array.isArray(item.categories)) {
        item.categories.forEach(category => {
            html += `<span class="alert alert-success" data-tag="${category}" tabindex="0" role="button">${capitalize(category)}</span>`;
        });
    }
    
    if (Array.isArray(item.targets)) {
        item.targets.forEach(target => {
            html += `<span class="alert alert-dark" data-tag="${target}" tabindex="0" role="button">${capitalize(target)}</span>`;
        });
    }
    
    return html;
}

function generateFilters() {
    const filterList = document.getElementById('filters');
    if (!filterList) return;

    filterList.innerHTML = '';

    const sections = [
        { title: 'Techniques', key: 'techniques', colorClass: 'btn-outline-primary' },
        { title: 'Categories', key: 'categories', colorClass: 'btn-outline-success' },
        { title: 'Targets', key: 'targets', colorClass: 'btn-outline-secondary' }
    ];

    sections.forEach(section => {
        if (state.tagsJSON[section.key]) {
            const filterSection = createFilterSection(
                section.title,
                state.tagsJSON[section.key],
                section.colorClass
            );
            filterList.appendChild(filterSection);
        }
    });
}

function createFilterSection(title, tags, colorClass) {
    const section = document.createElement('div');
    section.classList.add('filter-item');

    section.innerHTML = `
        <div class="title">${title}</div>
        <div>
            ${tags.map(tag => `
                <button type="button" class="btn ${colorClass} btn-sm" data-tag="${tag}" 
                        aria-label="Filter by ${capitalize(tag)}">
                    ${capitalize(tag)}
                </button>
            `).join('')}
        </div>
    `;

    section.querySelectorAll('button[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => toggleTagFilter(btn, btn.dataset.tag));
    });

    return section;
}

// Filtering
function toggleTagFilter(button, tag) {
    if (state.selectedTags.has(tag)) {
        state.selectedTags.delete(tag);
        button.classList.remove('active');
    } else {
        state.selectedTags.add(tag);
        button.classList.add('active');
    }
    filterItems();
}

function resetFilters() {
    state.selectedTags.clear();
    state.searchTerm = '';
    
    const searchInput = document.getElementById('search');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('#filters button[data-tag]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    filterItems();
    showToast('Filters reset', 'info');
}

function filterItems(customFilter = null) {
    const searchFilter = document.getElementById('search')?.value.trim().toLowerCase() || '';
    state.searchTerm = searchFilter;
    
    state.filteredData = state.dataJSON.filter(item => {
        if (customFilter && !customFilter(item)) return false;
        
        const title = (item.name || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        const tags = [
            ...(item.techniques || []),
            ...(item.categories || []),
            ...(item.targets || [])
        ];
        
        const matchesSearch = !searchFilter || title.includes(searchFilter) || description.includes(searchFilter);
        const matchesTags = state.selectedTags.size === 0 || 
            Array.from(state.selectedTags).some(tag => tags.includes(tag));

        return matchesSearch && matchesTags;
    });

    sortTools();
    updateActiveChips();
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) clearBtn.style.display = searchFilter ? 'block' : 'none';
}

const debouncedFilter = debounce(filterItems, 200);

// Event handlers
function setupSearch() {
    const searchInput = document.getElementById('search');
    const clearBtn = document.getElementById('clearSearch');
    const autocomplete = document.getElementById('autocomplete');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            debouncedFilter();
            debouncedAutocomplete(e.target.value);
        });
        
        searchInput.addEventListener('keydown', (e) => {
            const items = document.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                state.autocompleteIndex = Math.min(state.autocompleteIndex + 1, items.length - 1);
                updateAutocompleteSelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                state.autocompleteIndex = Math.max(state.autocompleteIndex - 1, -1);
                updateAutocompleteSelection(items);
            } else if (e.key === 'Enter' && state.autocompleteIndex >= 0) {
                e.preventDefault();
                items[state.autocompleteIndex]?.click();
            } else if (e.key === 'Escape') {
                if (autocomplete) autocomplete.style.display = 'none';
                if (searchInput.value) {
                    searchInput.value = '';
                    filterItems();
                } else {
                    searchInput.blur();
                }
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            if (autocomplete) autocomplete.style.display = 'none';
            filterItems();
        });
    }
    
    document.addEventListener('click', (e) => {
        if (autocomplete && searchInput && !searchInput.contains(e.target) && !autocomplete.contains(e.target)) {
            autocomplete.style.display = 'none';
        }
    });
}

function updateAutocompleteSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle('active', index === state.autocompleteIndex);
    });
}

function setupCardInteractions() {
    const dataList = document.getElementById('dataList');
    if (!dataList) return;

    dataList.addEventListener('click', (event) => {
        if (event.target.classList.contains('alert')) {
            const tag = event.target.dataset.tag;
            if (tag) {
                const filterBtn = document.querySelector(`#filters button[data-tag="${tag}"]`);
                if (filterBtn) {
                    filterBtn.click();
                    document.getElementById('filters').scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
}

function setupBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.pageYOffset > 300);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function setupMobileFilters() {
    const collapseBtn = document.getElementById('collapseFilters');
    const fabFilter = document.getElementById('fabFilter');
    const filtersBox = document.getElementById('filters');
    
    if (!filtersBox) return;

    [collapseBtn, fabFilter].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                filtersBox.classList.toggle('collapsed');
            });
        }
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        
        if (e.key === '/') {
            e.preventDefault();
            document.getElementById('search')?.focus();
        } else if (e.key === '?') {
            e.preventDefault();
            document.getElementById('shortcutsModal').style.display = 'flex';
        } else if (e.key.toLowerCase() === 'd') {
            toggleDarkMode();
        } else if (e.key.toLowerCase() === 'v') {
            toggleView();
        }
    });
}

function setupHeaderActions() {
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    document.getElementById('favoritesToggle')?.addEventListener('click', showFavorites);
    document.getElementById('shareBtn')?.addEventListener('click', shareFilters);
    document.getElementById('statsToggle')?.addEventListener('click', toggleStats);
    document.getElementById('legendToggle')?.addEventListener('click', toggleLegend);
    document.getElementById('viewToggle')?.addEventListener('click', toggleView);
    document.getElementById('sortSelect')?.addEventListener('change', sortTools);
    document.getElementById('clearAllFilters')?.addEventListener('click', resetFilters);
    document.getElementById('resetFromEmpty')?.addEventListener('click', resetFilters);
}

function initializeEventListeners() {
    setupSearch();
    setupCardInteractions();
    setupBackToTop();
    setupMobileFilters();
    setupKeyboardShortcuts();
    setupHeaderActions();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    initializeEventListeners();
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.HackerKit = { state, resetFilters, filterItems };
}
