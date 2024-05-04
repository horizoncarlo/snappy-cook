const API_URL = `http://${window.location.host}/`;

async function _get(url) {
  const response = await fetch(url);
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

async function _post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body)
  });
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

async function _put(url, body) {
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body)
  });
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

async function _delete(url) {
  const response = await fetch(url, { method: "DELETE" });
  if (response.ok) {
    return await response.json();
  }
  return Promise.reject(response.status + ": " + response.statusText);
}

let lastSortOrder = '';
async function getAllRecipesAPI(sortCol) {
  let apiEndpoint = 'recipes';
  if (typeof sortCol !== 'string' || sortCol === '') {
    sortCol = 'changedDate';
  }
  
  lastSortOrder = lastSortOrder === '' ? '-' : '';
  apiEndpoint += '?_sort=' + lastSortOrder + sortCol; // TODO Used to use this but no longer working, see https://github.com/typicode/json-server/issues/1498: + '&_order=' + lastSortOrder;
  
  return _get(API_URL + apiEndpoint);
}

async function saveRecipeAPI(recipe) {
  return _post(API_URL + 'recipes', recipe);
}

async function updateRecipeAPI(recipe) {
  return _put(API_URL + 'recipes/' + recipe.id, recipe);
}

async function deleteRecipeAPI(deleteId) {
  return _delete(API_URL + 'recipes/' + deleteId);
}