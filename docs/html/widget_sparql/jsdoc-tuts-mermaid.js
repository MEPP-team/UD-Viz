/**
 *
 */
function renderMermaidLangs() {
  [...document.querySelectorAll('.lang-mermaid')].forEach(
    (markdownGraphEl, i) => {
      const graphDefinition = markdownGraphEl.innerText;

      const cb = function (graphHTML) {
        const graphContainerEl = document.createElement('div');
        graphContainerEl.innerHTML = graphHTML;
        const graphEl = graphContainerEl.querySelector('svg');

        graphEl.style.display = 'block';
        graphEl.style.margin = '0 auto';
        graphContainerEl.style.margin = '50px 0';

        markdownGraphEl.replaceWith(graphContainerEl);
      };

      window.mermaid.render(`mermaid_graph_${i}`, graphDefinition, cb);
    }
  );
}

/**
 *
 */
function loadMermaid() {
  const mermaidjs = document.createElement('script');
  mermaidjs.src =
    'https://cdnjs.cloudflare.com/ajax/libs/mermaid/8.9.0/mermaid.min.js';
  document.body.appendChild(mermaidjs);

  mermaidjs.addEventListener('load', renderMermaidLangs);
}

document.addEventListener('DOMContentLoaded', loadMermaid);
