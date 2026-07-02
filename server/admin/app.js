const API = '/api/demo';
const tableBody = document.getElementById('tableBody');
const toast = document.getElementById('toast');
let currentFilter = 'all';
let allData = [];

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-show');
  setTimeout(() => toast.classList.remove('is-show'), 2500);
}

function getStatusBadge(status) {
      allData = data;
      renderTable(data);
      fetchStats();
    })
    });
}

function renderTable(data) {
  if (!data.length) {
      document.getElementById('statTotal').textContent = s.total;
      document.getElementById('statPending').textContent = s.pending;
      document.getElementById('statContacted').textContent = s.contacted;
      document.getElementById('statToday').textContent = s.today;
    })
  }
});

// Tabs
    tab.classList.add('is-active');
    currentFilter = tab.dataset.filter;
    fetchData(currentFilter);
  });
});

// Refresh
