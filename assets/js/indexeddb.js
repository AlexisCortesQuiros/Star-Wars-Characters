// indexeddb.js

async function addToFavorites(character) {
    const db = await openDatabase();

    if (!(await isInFavoritesDB(character, db))) {
        await saveFavoriteToDB(character, db);
        alert('Personaje agregado a favoritos');
    } else {
        alert('El personaje ya está en favoritos');
    }
}

async function removeFromFavorites(character) {
    const db = await openDatabase();
    await removeFromFavoritesDB(character, db);
    alert('Personaje eliminado de favoritos');
    loadFavoriteCharacters();
}

async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('favorites', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('characters', { keyPath: 'url' });
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function isInFavoritesDB(character, db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['characters'], 'readonly');
        const store = transaction.objectStore('characters');
        const request = store.get(character.url);

        request.onsuccess = (event) => {
            resolve(!!event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function saveFavoriteToDB(character, db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['characters'], 'readwrite');
        const store = transaction.objectStore('characters');
        const request = store.add(character);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function removeFromFavoritesDB(character, db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['characters'], 'readwrite');
        const store = transaction.objectStore('characters');
        const request = store.delete(character.url);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

async function loadFavoriteCharacters() {
    const favorites = await getAllFavoritesFromDB();
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    if (favorites.length === 0) {
        mainContent.innerText = 'No hay personajes favoritos';
        return;
    }

    favorites.forEach((character) => {
        const card = createCharacterCard(character);
        const removeFromFavoritesButton = document.createElement("button");
        removeFromFavoritesButton.className = "remove-from-favorites-button";
        removeFromFavoritesButton.innerText = "Quitar de favoritos";
        removeFromFavoritesButton.onclick = () => removeFromFavorites(character);
        card.appendChild(removeFromFavoritesButton);
        mainContent.appendChild(card);
    });
}

async function getAllFavoritesFromDB() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['characters'], 'readonly');
        const store = transaction.objectStore('characters');
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result || []);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
