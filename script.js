let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let allData = [];

// --- Charger le JSON et afficher les cartes ---
async function loadData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    allData = data.sources;
    displayCards(allData);
    renderWishlist();
  } catch (error) {
    console.error("Erreur de chargement du JSON :", error);
  }
}

// --- Afficher toutes les cartes filtrées ---
function displayCards(sources) {
  const container = document.getElementById('cards');
  container.innerHTML = '';

  // Récupérer valeurs des filtres
  const stageFilter = document.getElementById('filter-stage').value;
  const needFilter = document.getElementById('filter-need').value;

  sources.forEach(source => {
    source.calls.forEach(call => {
      // --- Filtres ---
      if (stageFilter && call.stage !== stageFilter) return;
      if (needFilter && !call.tags.includes(needFilter)) return;

      const card = createCard(call, source);
      container.appendChild(card);
    });
  });
}

// --- Créer une carte ---
function createCard(call, source) {
  const card = document.createElement('div');
  card.className = 'card';

  card.innerHTML = `
    <h2>${call.title}</h2>
    <p><strong>Structure :</strong> ${source.name}</p>
    <p>${call.note}</p>
    <p>📅 Date limite : ${call.deadline}</p>
    <a href="${call.url}" target="_blank">Voir le projet</a>
  `;

  const tagContainer = document.createElement('div');
  (source.tags.concat(call.tags || [])).forEach(tag => {
    const span = document.createElement('span');
    span.className='tag'; span.textContent=tag;
    tagContainer.appendChild(span);
  });
  card.appendChild(tagContainer);

  const wishlistBtn = document.createElement('button');
  wishlistBtn.className='wishlist-btn';
  wishlistBtn.textContent = wishlist.some(item => item.id === source.name+'::'+call.title) ? '⭐ Retirer' : '⭐ Ajouter';

  wishlistBtn.addEventListener('click', () => {
    toggleWishlist(call, source.name, wishlistBtn);
  });
  card.appendChild(wishlistBtn);

  // Highlight si déjà dans wishlist
  if(wishlist.some(item => item.id === source.name+'::'+call.title)){
    card.classList.add('selected');
  }

  return card;
}

// --- Ajouter / retirer dans la wishlist ---
function toggleWishlist(call, sourceName, button){
  const id = sourceName+'::'+call.title;
  const index = wishlist.findIndex(item=>item.id===id);

  if(index === -1){
    wishlist.push({...call, source:sourceName, id});
    button.textContent = '⭐ Retirer';
  } else {
    wishlist.splice(index,1);
    button.textContent = '⭐ Ajouter';
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  renderWishlist();
  displayCards(allData); // Mettre à jour highlight des cartes
}

// --- Afficher la wishlist ---
function renderWishlist(){
  const list = document.getElementById('wishlist-list');
  list.innerHTML = '';
  wishlist.forEach(item=>{
    const li = document.createElement('li');
    li.textContent = `${item.title} (${item.source})`;
    list.appendChild(li);
  });
}

// --- Télécharger PDF ---
function downloadWishlistPDF(){
  if(wishlist.length===0) return alert("Ta sélection est vide !");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  wishlist.forEach((item, idx)=>{
    doc.setFontSize(12); doc.text(`${idx+1}. ${item.title}`,10,y); y+=6;
    doc.setFontSize(10); doc.text(`Structure : ${item.source}`,10,y); y+=5;
    doc.text(`Date limite : ${item.deadline}`,10,y); y+=5;
    doc.text(`Tags : ${(item.tags||[]).join(', ')}`,10,y); y+=5;
    doc.text(`Note : ${item.note}`,10,y); y+=10;
    if(y>270){ doc.addPage(); y=10; }
  });

  doc.save('wishlist.pdf');
}

// --- Vider la wishlist ---
function clearWishlist(){
  wishlist = [];
  localStorage.removeItem('wishlist');
  renderWishlist();
  displayCards(allData);
}

// --- Event listeners ---
document.getElementById('download-wishlist').addEventListener('click', downloadWishlistPDF);
document.getElementById('filter-stage').addEventListener('change', () => displayCards(allData));
document.getElementById('filter-need').addEventListener('change', () => displayCards(allData));

// Ajouter le bouton “Vider ma sélection”
const clearBtn = document.createElement('button');
clearBtn.textContent = '🗑 Vider ma sélection';
clearBtn.style.marginTop = '0.5rem';
clearBtn.addEventListener('click', clearWishlist);
document.getElementById('wishlist-container').appendChild(clearBtn);

// --- Initialisation ---
loadData();
