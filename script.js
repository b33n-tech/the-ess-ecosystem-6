let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let allData = [];

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

function displayCards(sources) {
  const container = document.getElementById('cards');
  container.innerHTML = '';

  const stageFilter = document.getElementById('filter-stage').value;
  const needFilter = document.getElementById('filter-need').value;
  const deadlineFilter = document.getElementById('filter-deadline').value;

  sources.forEach(source => {
    source.calls.forEach(call => {
      // Filtres
      if(stageFilter && (call.stage||'').toLowerCase() !== stageFilter.toLowerCase()) return;
      if(needFilter && !((call.tags||[]).map(t=>t.toLowerCase()).includes(needFilter.toLowerCase()))) return;

      if(deadlineFilter){
        const now = new Date();
        const callDate = new Date(call.deadline);
        if(deadlineFilter==='now' && callDate>now) return;
        if(deadlineFilter==='1month' && (callDate-now)/(1000*60*60*24)>30) return;
        if(deadlineFilter==='3months' && (callDate-now)/(1000*60*60*24)>90) return;
      }

      const card = createCard(call, source);
      container.appendChild(card);
    });
  });
}

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
  const allTags = (source.tags||[]).concat(call.tags||[]);
  if(call.stage) allTags.push(call.stage);

  allTags.forEach(tag=>{
    const span = document.createElement('span');
    span.className='tag';
    span.textContent = tag;
    tagContainer.appendChild(span);
  });
  card.appendChild(tagContainer);

  const wishlistBtn = document.createElement('button');
  wishlistBtn.className='wishlist-btn';
  wishlistBtn.textContent = wishlist.some(item=>item.id===source.name+'::'+call.title) ? '⭐ Retirer' : '⭐ Ajouter';

  wishlistBtn.addEventListener('click', ()=>{
    toggleWishlist(call, source.name, wishlistBtn);
  });
  card.appendChild(wishlistBtn);

  if(wishlist.some(item=>item.id===source.name+'::'+call.title)){
    card.classList.add('selected');
  }

  return card;
}

function toggleWishlist(call, sourceName, button){
  const id = sourceName+'::'+call.title;
  const index = wishlist.findIndex(item=>item.id===id);

  if(index===-1){
    wishlist.push({...call, source:sourceName, id});
    button.textContent='⭐ Retirer';
  } else {
    wishlist.splice(index,1);
    button.textContent='⭐ Ajouter';
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  renderWishlist();
  displayCards(allData);
}

function renderWishlist(){
  const list = document.getElementById('wishlist-list');
  list.innerHTML = '';
  wishlist.forEach(item=>{
    const li = document.createElement('li');
    li.textContent = `${item.title} (${item.source})`;
    list.appendChild(li);
  });
}

function downloadWishlistPDF(){
  if(wishlist.length===0) return alert("Ta sélection est vide !");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y=10;

  wishlist.forEach((item,idx)=>{
    doc.setFontSize(12); doc.text(`${idx+1}. ${item.title}`,10,y); y+=6;
    doc.setFontSize(10);
    doc.text(`Structure : ${item.source}`,10,y); y+=5;
    doc.text(`Date limite : ${item.deadline}`,10,y); y+=5;
    doc.text(`Tags : ${(item.tags||[]).join(', ')} | Stade : ${item.stage||'N/A'}`,10,y); y+=5;
    doc.text(`Note : ${item.note}`,10,y); y+=10;
    if(y>270){ doc.addPage(); y=10; }
  });

  doc.save('wishlist.pdf');
}

function clearWishlist(){
  wishlist=[];
  localStorage.removeItem('wishlist');
  renderWishlist();
  displayCards(allData);
}

document.getElementById('download-wishlist').addEventListener('click', downloadWishlistPDF);
document.getElementById('filter-stage').addEventListener('change', ()=>displayCards(allData));
document.getElementById('filter-need').addEventListener('change', ()=>displayCards(allData));
document.getElementById('filter-deadline').addEventListener('change', ()=>displayCards(allData));

const clearBtn = document.createElement('button');
clearBtn.textContent='🗑 Vider ma sélection';
clearBtn.style.marginTop='0.5rem';
clearBtn.addEventListener('click', clearWishlist);
document.getElementById('wishlist-container').appendChild(clearBtn);

loadData();
