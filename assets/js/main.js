let currentPageUrl = 'https://swapi.dev/api/people/';
const nextButton = document.getElementById('next-btn');
const backButton = document.getElementById('back-btn');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const favoritesButton = document.getElementById('favorites-btn');

/* Functions */

window.onload = async () => {
    try {
        await loadCharacters(currentPageUrl);
    } catch (error) {
        console.log(error);
        alert('Error al cargar los personajes');
    }

    nextButton.addEventListener('click', loadNextPage);
    backButton.addEventListener('click', loadPreviousPage);
    favoritesButton.addEventListener('click', loadFavoriteCharacters);
};

async function loadCharacters(url) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    try {
        const response = await fetch(url);
        const responseJson = await response.json();

        responseJson.results.forEach((character) => {
            const card = createCharacterCard(character);
            mainContent.appendChild(card);
        });

        nextButton.disabled = !responseJson.next;
        backButton.disabled = !responseJson.previous;

        backButton.style.visibility = responseJson.previous ? "visible" : "hidden";
        currentPageUrl = url;

    } catch (error) {
        console.log(error);
        alert('Error al cargar las tarjetas');
    }
}

function createCharacterCard(character) {
    const card = document.createElement("div");
    card.style.backgroundImage = `url('https://starwars-visualguide.com/assets/img/characters/${character.url.replace(/\D/g, "")}.jpg')`;
    card.className = "cards";

    const characterNameBg = document.createElement("div");
    characterNameBg.className = "character-name-bg";

    const characterName = document.createElement("span");
    characterName.className = "character-name";
    characterName.innerText = `${character.name}`;

    characterNameBg.appendChild(characterName);
    card.appendChild(characterNameBg);

    const addToFavoritesButton = document.createElement("button");
    addToFavoritesButton.className = "add-to-favorites-button";
    addToFavoritesButton.innerText = "Agregar a favoritos";
    addToFavoritesButton.onclick = () => addToFavorites(character);
    card.appendChild(addToFavoritesButton);

    card.onclick = () => {
        modal.style.visibility = "visible";
        modalContent.innerHTML = '';
        const characterImage = document.createElement("div");
        characterImage.style.backgroundImage = `url('https://starwars-visualguide.com/assets/img/characters/${character.url.replace(/\D/g, "")}.jpg')`;
        characterImage.className = "character-image";
        const name = document.createElement("span");
        name.className = "character-details";
        name.innerText = `Nombre: ${character.name}`;
        const characterHeight = document.createElement("span");
        characterHeight.className = "character-details";
        characterHeight.innerHTML = `Altura: ${convertHeight(character.height)}`;
        const mass = document.createElement("span");
        mass.className = "character-details";
        mass.innerText = `Peso: ${convertMass(character.mass)}`;
        const eyeColor = document.createElement("span");
        eyeColor.className = "character-details";
        eyeColor.innerText = `Color de Ojos: ${translateEyeColor(character.eye_color)}`;
        const birthYear = document.createElement("span");
        birthYear.className = "character-details";
        birthYear.innerText = `Nacimiento: ${converBirthYear(character.birth_year)}`;
        modalContent.appendChild(characterImage);
        modalContent.appendChild(name);
        modalContent.appendChild(characterHeight);
        modalContent.appendChild(mass);
        modalContent.appendChild(eyeColor);
        modalContent.appendChild(birthYear);
    }

    return card;
}

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

/* Translate Functions */

function translateEyeColor(eyeColor) {
    const colors = {
        blue: "azul",
        brown: "marrón",
        green: "verde",
        yellow: "amarillo",
        black: "negro",
        pink: "rosa",
        red: "rojo",
        orange: "naranja",
        hazel: "avellana",
        unknown: "desconocido"
    };

    return colors[eyeColor.toLowerCase()] || eyeColor;
}

function convertHeight(height) {
    if (height === "unknown") {
        return "desconocida";
    }

    return (height / 100).toFixed(2);
}

function convertMass(mass) {
    if (mass === "unknown") {
        return "desconocido";
    }

    return `${mass} kg`;
}

function converBirthYear(birthYear) {
    if (birthYear === "unknown") {
        return "desconocida";
    }

    return birthYear;
}

function hideModal() {
    modal.style.visibility = "hidden";
}

/* Buttons */

async function loadNextPage() {
    if (!currentPageUrl) return;

    try {
        const response = await fetch(currentPageUrl);
        const responseJson = await response.json();

        await loadCharacters(responseJson.next);
    } catch (error) {
        console.log(error);
        alert('Error al cargar la próxima página');
    }
}

async function loadPreviousPage() {
    if (!currentPageUrl) return;

    try {
        const response = await fetch(currentPageUrl);
        const responseJson = await response.json();

        await loadCharacters(responseJson.previous);
    } catch (error) {
        console.log(error);
        alert('Error al cargar la página anterior');
    }
}



  

  

