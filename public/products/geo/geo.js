function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && typeof value === "string") element.textContent = value;
}

function setTextAfterIcon(selector, value) {
  const element = document.querySelector(selector);
  if (!element || typeof value !== "string") return;
  const icon = element.firstElementChild;
  element.replaceChildren(...(icon ? [icon, document.createTextNode(` ${value}`)] : [document.createTextNode(value)]));
}

function setTitledItems(selector, items) {
  document.querySelectorAll(selector).forEach((element, index) => {
    const item = items[index];
    if (!item) return;
    const title = element.querySelector("strong");
    if (title) title.textContent = item.title;

    const body = element.querySelector(":scope > span:last-child");
    if (body && body !== title) {
      body.textContent = item.body;
      return;
    }

    const paragraph = element.querySelector("p");
    if (paragraph && title) paragraph.replaceChildren(title, document.createTextNode(item.body));
    else if (title) element.replaceChildren(title, document.createTextNode(item.body));
  });
}

function applyContent(content) {
  document.title = content.meta.pageTitle;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = content.meta.description;

  setTextAfterIcon(".system-name", content.system.name);
  setText(".system-state", content.system.state);
  setText(".hero-kicker", content.hero.kicker);
  setText(".geo-mark", content.hero.geoMark);
  document.querySelector(".geo-mark")?.setAttribute("data-text", content.hero.geoMark);
  setText("h1", content.hero.title);
  setText(".hero-subtitle", content.hero.subtitle);
  document.querySelectorAll(".feature-tag").forEach((element, index) => {
    const number = element.querySelector("b");
    const value = content.hero.features[index];
    if (number && value) element.replaceChildren(number, document.createTextNode(` ${value}`));
  });

  setTextAfterIcon("#intro-title", content.intro.title);
  setText(".intro-card > p", content.intro.body);
  setTextAfterIcon("#pain-title", content.pain.title);
  setTitledItems(".pain-list li", content.pain.items);

  setText(".solution-highlight strong", content.solution.title);
  const solutionParagraph = document.querySelector(".solution-highlight p");
  const solutionTitle = solutionParagraph?.querySelector("strong");
  if (solutionParagraph && solutionTitle) {
    solutionParagraph.replaceChildren(solutionTitle, document.createTextNode(` ${content.solution.body}`));
  }

  setTextAfterIcon("#comparison-section-title", content.comparison.sectionTitle);
  setText(".table-card h3", `⚡ ${content.comparison.title}`);
  document.querySelectorAll(".data-table thead th").forEach((element, index) => {
    element.textContent = content.comparison.headers[index] ?? element.textContent;
  });
  document.querySelectorAll(".data-table tbody tr").forEach((row, index) => {
    const item = content.comparison.rows[index];
    if (!item) return;
    const cells = row.querySelectorAll("td");
    [item.dimension, item.city, item.geo].forEach((value, cellIndex) => {
      if (cells[cellIndex]) cells[cellIndex].textContent = value;
    });
  });

  setTextAfterIcon("#saas-title", content.saas.title);
  setTitledItems(".core-list li", content.saas.items);
  setTextAfterIcon("#advantages-title", content.advantages.title);
  setTitledItems(".advantage-list li", content.advantages.items);

  setTextAfterIcon("#support-title", content.support.title);
  document.querySelectorAll(".support-card").forEach((card, index) => {
    const item = content.support.items[index];
    if (!item) return;
    const title = card.querySelector("h3");
    const body = card.querySelector("p");
    if (title) title.textContent = item.title;
    if (body) body.textContent = item.body;
  });

  setText(".asset-heading strong", content.asset.number);
  setText(".asset-heading span", content.asset.title);
  setTextAfterIcon(".asset-location", content.asset.location);
  setText(".digital-asset > p:last-child", content.asset.body);
  setText(".footer-slogan", content.footer.slogan);
  const footerTitle = document.querySelector(".footer-title");
  const company = footerTitle?.querySelector("strong");
  if (footerTitle && company) {
    company.textContent = content.footer.company;
    footerTitle.replaceChildren(document.createTextNode(`${content.footer.titlePrefix} `), company);
  }
  setText(".footer-note", content.footer.note);

  document.documentElement.dataset.contentState = "loaded";
  window.dispatchEvent(new CustomEvent("geo:content-loaded", { detail: content }));
}

window.__applyContent = applyContent;

const initialContentElement = document.querySelector("#initial-content");
if (initialContentElement) {
  try {
    applyContent(JSON.parse(initialContentElement.textContent));
  } catch {
    document.documentElement.dataset.contentState = "fallback";
  }
}

fetch("/api.php?action=content", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error("content unavailable");
    return response.json();
  })
  .then(applyContent)
  .catch(() => {
    document.documentElement.dataset.contentState = "fallback";
  });
