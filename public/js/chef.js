var state = {
  bodyReady: false,
  loading: false,
  searchIn: '',
  searchCount: null,
  recipes: [],
  recipeIn: {}, /*
    id: "",
    changedDate: "",
    name: "",
    notes: "",
    tags: []
  */
  tags: [],
  tagIn: '',
  week: [],
  dayIn: {} /*
    id: "",
    index: -1,
    dayName: '',
    dayNumber: 0,
    recipeId: '',
    tags: []
  */
}

function init() {
  resetRecipeIn();
  
  if (isMobileSize()) {
    addCSSLink('mobile-css', './css/mobile.css');
  }
  
  // Listen for Alpine to be done setting up
  document.addEventListener('alpine:initialized', () => {
    alpineInit();
    
    // Next listen for Shoelace Style components to be done setting up
    customElements.whenDefined('sl-alert').then(() => { shoelaceInit(); });
  });
}
init();

function alpineInit() {
  state = Alpine.reactive(state);
}

function shoelaceInit() {
  getAllTags();
  getAllRecipes('', true);
  getAllDays();
}

function matchesSearch(recipeObj, searchText) {
  if (searchText && typeof searchText === 'string' && searchText.trim().length > 0) {
    return recipeObj.name?.toLowerCase().includes(searchText.toLowerCase()) ||
           recipeObj.tags.filter(tag => tag.toLowerCase().includes(searchText.toLowerCase())).length > 0;
  }
  return true;
}
