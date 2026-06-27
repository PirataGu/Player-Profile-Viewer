let players = [];
let currentServer = 0;
// MOSTRAR TEXTO NO CARD COM MENSAGEM PARA QUANDO NÃO TIVER DADOS SIMPLESMENTE MOSTRAR "JOGADOR NUNCA JOGOU"
Papa.parse("complete_data.csv", { //CSV GERAL
  download: true,
  header: true,
  complete: function (results) {
    players = results.data;
    console.log("CSV carregado:", players.length);
    buildLeaderboard();
    buildPlaytimeLeaderboard();
  }
});

function buildLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  if (!list) return;

  // Ordenar por claim_blocks + spent_claim_blocks (total) descendente e pegar top 10
  const top10 = [...players]
    .filter(p => p.username && (p.claim_blocks || p.spent_claim_blocks || p.ClaimBlocks_S22))
    .map(p => ({
      ...p,
      _total: Number(p.claim_blocks || 0) + Number(p.spent_claim_blocks || 0) + Number(p.ClaimBlocks_S22 || 0)
    }))
    .filter(p => p._total > 0)
    .sort((a, b) => b._total - a._total)
    .slice(0, 10);

  if (top10.length === 0) {
    list.innerHTML = '<p class="leaderboard-loading">Sem dados disponíveis.</p>';
    return;
  }

  list.innerHTML = top10.map((player, i) => {
    const rank = i + 1;
    const rankClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
    const total = player._total.toLocaleString("pt-PT");
    const skinUrl = `https://mc-heads.net/avatar/${player.username}/32`;
    return `
      <div class="leaderboard-row" style="cursor:pointer" onclick="searchFromLeaderboard('${player.username}')">
        <div class="lb-rank ${rankClass}">${rank}</div>
        <img class="lb-skin" src="${skinUrl}" alt="${player.username}" loading="lazy">
        <span class="lb-name">${player.username}</span>
        <span class="lb-value">${total}</span>
      </div>`;
  }).join("");
}

function buildPlaytimeLeaderboard() {
  const list = document.getElementById("leaderboard-playtime-list");
  if (!list) return;

  const top10 = [...players]
    .filter(p => p.username && p.TotalPlayTime_hours && !isNaN(Number(p.TotalPlayTime_hours)))
    .sort((a, b) => Number(b.TotalPlayTime_hours) - Number(a.TotalPlayTime_hours))
    .slice(0, 10);

  if (top10.length === 0) {
    list.innerHTML = '<p class="leaderboard-loading">Sem dados disponíveis.</p>';
    return;
  }

  list.innerHTML = top10.map((player, i) => {
    const rank = i + 1;
    const rankClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
    const totalHours = Number(player.TotalPlayTime_hours);
    const hours = Math.floor(totalHours);
    const remMins = ((totalHours - hours) * 60).toFixed(2);
    const formatted = hours > 0 ? `${hours}h ${remMins}m` : `${remMins}m`;
    const skinUrl = `https://mc-heads.net/avatar/${player.username}/32`;
    return `
      <div class="leaderboard-row" style="cursor:pointer" onclick="searchFromLeaderboard('${player.username}')">
        <div class="lb-rank ${rankClass}">${rank}</div>
        <img class="lb-skin" src="${skinUrl}" alt="${player.username}" loading="lazy">
        <span class="lb-name">${player.username}</span>
        <span class="lb-value">${formatted}</span>
      </div>`;
  }).join("");
}

function searchFromLeaderboard(username) {
  document.getElementById("search").value = username;
  searchPlayer();
}

// var nome_da_variavel = ... :: ignora blocos if, for..., pode ser recriada e é boa só antes de correr o código. Só existe hoje por compatibilidade com código antigo. NUNCA USAR!
// const nome_da_variavel = ...  :: uma variável que não muda. Valor Fixo. Útil para algo que não deva mudar de todo. Dentro de functions elas só existirão dentro das mesmas!
// let nome_da_variavel = ... :: uma variável que pode mudar mas não pode ser novamente redaclarada aka não podemos fazer, novamente, let nome_da_variavel
// nome_da_variavel = ... :: uma variável global que pode mudar
function searchPlayer() {
  const input = document.getElementById("search").value.trim().toLowerCase();
  if (!input) return;

  // Esconder os leaderboards ao pesquisar
  document.querySelectorAll(".leaderboard-card").forEach(el => el.classList.add("hidden"));

  const player = players.find(p =>
    p.username && p.username.toLowerCase() === input
  );

  selectedPlayer = player //colocar a variavel global em todo o ficheiro (em python: global player)
  if (!player) {
    alert("Jogador não encontrado 😢");
    // Mesmo assim atualiza os cards com fallback
    updateCards(null);
    return;
  }

  // Se encontrou, atualiza os cards com os dados reais
  updateCards(player);
  updateStats(selectedPlayer, servers[currentServer].name);

  document.getElementById("skin").src =
    `https://mc-heads.net/avatar/${player.username}/128`;

  // Datas
  document.getElementById("firstJoin").textContent =
    player.creation_date
      ? new Date(player.creation_date).toLocaleDateString("pt-PT")
      : "—";

  document.getElementById("lastSeen").textContent =
    player.last_seen
      ? new Date(player.last_seen).toLocaleString("pt-PT") // ? é perguntar se é True , ou seja, se existe
      : "—"; //caso não existir (False) ele dá "-" como resposta

  // Mostrar cards
  document.getElementById("player-card").classList.remove("hidden");
  document.getElementById("player-card-two").classList.remove("hidden");
  document.getElementById("player-card-three").classList.remove("hidden");

  // Dados do .csv
  document.getElementById("username").textContent = player.username;



  // Prefix com cores (<#FF4649>)
  if (player.group_prefix) {
    document.getElementById("group").innerHTML = player.group_prefix
      .replace(/<#([0-9A-Fa-f]{6})>/g, '<span style="color:#$1">')
      .replace(/<\/#([0-9A-Fa-f]{6})>/g, '</span>');
  } else {
    document.getElementById("group").textContent = "";
  }
  document.getElementById("coins").textContent =
    Math.floor(Number(player.coins || 0)).toLocaleString("pt-PT");

  document.getElementById("souls").textContent = player.souls ?? "0";
  document.getElementById("claims").textContent = player.claim_blocks ?? "0";
}


const servers = [
  {
    name: "Survival",
    icon: "survival_logo.png",
    data: players.survival  // Dados do servidor normal
  },
  {
    name: "Survival (2022)",
    icon: "survival2022_logo.png",
    data: players.survival2022  // Dados do servidor 2022
  }
];
console.log(servers[currentServer].data);
const card = document.querySelectorAll(".card")[1];
const icon = document.getElementById("server-icon");
const switchBtn = document.getElementById("switch-server");

switchBtn.addEventListener("click", () => {
  if (!selectedPlayer) return; // nenhum jogador selecionado, não faz nada

  card.classList.remove("switching");
  void card.offsetWidth;
  card.classList.add("switching");

  setTimeout(() => {
    currentServer = (currentServer + 1) % servers.length;
    icon.src = servers[currentServer].icon;

    // Atualiza stats do jogador selecionado
    updateStats(selectedPlayer, servers[currentServer].name);

    card.classList.remove("switching");
  }, 300);
});

function updateStats(player, serverName) {
  // Coins e bank_coins dependendo do servidor
  if (serverName === "Survival") {
    document.getElementById("coins").textContent = player.coins || 0;
    document.getElementById("bank_coins").textContent = player.bank_coins || 0;
  } else if (serverName === "Survival (2022)") {
    document.getElementById("coins").textContent = player.bank_coins_s22 || 0;
    document.getElementById("bank_coins").textContent = player.bank_coins_s22 || 0;
  }

  // Stats comuns
  document.getElementById("skins_total").textContent = player.skins_total || 0;
  document.getElementById("bank_level").textContent = player.bank_level || 0;
  document.getElementById("credits_coin").textContent = player.credits_coin || 0;

  // Skills
  // As 8 skills do Survival existem também no S22 com o mesmo nome.
  // Reutilizamos os mesmos elementos HTML (skill_*) para ambos os servidores.
  const skills = ["alchemy", "archery", "enchanting", "excavation", "farming", "fishing", "foraging", "mining"];

  if (serverName === "Survival") {
    skills.forEach(skill => {
      const el = document.getElementById("skill_" + skill);
      if (el) el.textContent = player["skill_" + skill] || 0;
    });
  } else if (serverName === "Survival (2022)") {
    // Colunas no CSV: s22_skill_<nome>_level
    skills.forEach(skill => {
      const el = document.getElementById("skill_" + skill);
      if (el) el.textContent = player["s22_skill_" + skill + "_level"] || 0;
    });
  }

  // Stats S22 só existem no servidor S22
  if (serverName === "Survival (2022)") {
    const s22Stats = [
      "Event_Wins_S22", "Mob_Kills_S22", "Colection_S22", "TotalVotes_S22",
      "ClaimBlocks_S22", "Mined_Blocks_S22", "TotalPlayTime_hours",
      "dungeon_points_s22", "bank_coins_s22", "Kills_s22", "dragon_kill_s22"
    ];
    s22Stats.forEach(stat => {
      const el = document.getElementById(stat);
      if (el) {
        if (stat === "TotalPlayTime_hours" && player[stat]) {
          el.textContent = Number(player[stat]).toFixed(2);
        } else {
          el.textContent = player[stat] || 0;
        }
      }
    });
  } else {
    // Limpar os spans S22 se estiver no servidor normal
    const s22Stats = [
      "Event_Wins_S22", "Mob_Kills_S22", "Colection_S22", "TotalVotes_S22",
      "ClaimBlocks_S22", "Mined_Blocks_S22", "TotalPlayTime_hours",
      "dungeon_points_s22", "bank_coins_s22", "Kills_s22", "dragon_kill_s22"
    ];
    s22Stats.forEach(stat => {
      const el = document.getElementById(stat);
      if (el) el.textContent = "-"; // ou 0
    });
  }

  // Mostrar o card
  document.getElementById("player-card").classList.remove("hidden");
}





function updateCards(player) {
  const dungeons = ["marfantasma", "minaperdida", "neoncity", "ruinaslendarias"];
  const stats = [
    "FOOD_EATEN", "WAVES_PASSED", "GAMES_LOST", "GAMES_PLAYED",
    "MOB_KILLS", "BEST_KILL_STREAK", "DEATHS", "POTIONS_DRUNK",
    "GAMES_WON", "ARROWS_LAUNCHED", "COINS_SPENT", "TNT_EXPLODED",
    "EQUIPMENT_BROKEN"
  ];

  dungeons.forEach(dungeon => {
    stats.forEach(stat => {
      const key = `${stat}_${dungeon}`;
      const el = document.getElementById(`${dungeon}_${stat}`);

      if (el) {
        // Se player não tiver valor, mostra fallback
        el.textContent = player && player[key] !== undefined && player[key] !== ""
          ? player[key]
          : "JOGADOR NUNCA JOGOU";
      }
    });
  });
}

const cards = [...document.querySelectorAll('.carddungeon')];
const total = cards.length;
let active = 0;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function update() {
  cards.forEach((card, i) => {
    card.className = 'carddungeon';

    if (i === active) {
      card.classList.add('active');
    }
    else if (i === mod(active - 1, total)) {
      card.classList.add('left');
    }
    else if (i === mod(active + 1, total)) {
      card.classList.add('right');
    }
    else {
      if (i < mod(i, total)) {
        card.classList.add('hiddenleft');
      } else {
        card.classList.add('hiddenright');
      }
    }
  });
}

cards.forEach((card, i) => {
  card.addEventListener('click', () => {
    active = i;
    update();
  });
});

update();
