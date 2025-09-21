document.querySelectorAll('.header-nav .tab').forEach(tab => {
    tab.addEventListener('click', function(e) {
        e.preventDefault();
        // Remove active class from all tabs
        document.querySelectorAll('.header-nav .tab').forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        // Hide all sections
        document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
        // Show selected section
        const selected = tab.getAttribute('data-tab');
        document.getElementById(selected).classList.add('active');
    });
});

let publications = [];
let allSubjectTags = [];
let allMethodTags = [];
let selectedSubjects = [];  // Array of selected topics
let selectedMethods = [];   // Array of selected methods

function renderChips(tags, selectedTags, containerId, onToggle) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'filter-chip' + (selectedTags.includes(tag) ? ' active' : '');
        chip.textContent = tag;
        chip.onclick = function () {
            onToggle(tag);
        };
        container.appendChild(chip);
    });
}

function filterPublications() {
    return publications.filter(pub => {
        // Subject match: If no subjects, allow all. Else, match any selected.
        const subjMatch =
            selectedSubjects.length === 0 ||
            (Array.isArray(pub.subject_tags) &&
             selectedSubjects.some(tag => pub.subject_tags.includes(tag)));
        // Method match: Same principle.
        const methMatch =
            selectedMethods.length === 0 ||
            (Array.isArray(pub.method_tags) &&
             selectedMethods.some(tag => pub.method_tags.includes(tag)));
        // Show only papers that match both
        return subjMatch && methMatch;
    });
}

/*function renderPublicationsList() {
    const pubs = filterPublications();
    document.getElementById('publications-list').innerHTML =
        pubs.length ? pubs.map(pub => 
            `<div class="paper">
                <h3>${pub.title}</h3>
                <div><strong>Authors:</strong> ${pub.authors || ""}</div>
                <div><strong>Journal:</strong> ${pub.journal}, <strong>Year:</strong> ${pub.year}</div>
            </div>`).join('') : "<em>No publications found for these filters.</em>";
}*/

function renderPublicationsList() {
    let pubs = filterPublications();
    pubs.sort((a, b) => (b.year || 0) - (a.year || 0));
    document.getElementById('publications-list').innerHTML =
        pubs.length ? pubs.map(pub => `
            <div class="paper">
                <h3>
                  ${pub.title}
                  ${pub.journal ? `<span style="font-size:0.9em; font-weight:normal; margin-left:8px">(${pub.journal}, ${pub.year})</span>` : ''}
                </h3>
                ${pub.authors ? `<div><strong>Co-authors:</strong> ${pub.authors || ""}</div>` : ''}
                <div class="meta-row">
                    ${pub.abstract ?
                  `<button class="show-abstractBtn">Show Abstract</button>
                   <div class="abstract" style="display:none;"><p>${pub.abstract}</p></div>` : ''}
                    <div class="tags">
                        ${(pub.subject_tags ? pub.subject_tags.join(', ') : '')}${(pub.method_tags ? ', ' + pub.method_tags.join(', ') : '')}
                    </div>
                    <div class="links">
                        ${pub.arxiv_link ? `<a href="${pub.arxiv_link}" target="_blank">arXiv</a>` : ''}
                        ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank">DOI</a>` : ''}
                    </div>
                </div>
            </div>
        `).join('') : "<em>No publications found for this filter.</em>";

    // Attach dropdown behavior
    document.querySelectorAll('.show-abstractBtn').forEach(btn => {
        btn.onclick = function() {
            const abstractDiv = btn.parentNode.parentNode.querySelector('.abstract');
            if (abstractDiv.style.display === 'none') {
                abstractDiv.style.display = 'block';
                btn.textContent = 'Hide Abstract';
                if (window.MathJax) MathJax.typeset();
            } else {
                abstractDiv.style.display = 'none';
                btn.textContent = 'Show Abstract';
            }
        }
    });

    if (window.MathJax) MathJax.typeset();
}

function subjectToggle(tag) {
    if (selectedSubjects.includes(tag)) {
        selectedSubjects = selectedSubjects.filter(t => t !== tag); // Remove tag
    } else {
        selectedSubjects.push(tag); // Add tag
    }
    renderChips(allSubjectTags, selectedSubjects, "subject-tags", subjectToggle);
    renderPublicationsList();
}

function methodToggle(tag) {
    if (selectedMethods.includes(tag)) {
        selectedMethods = selectedMethods.filter(t => t !== tag); // Remove tag
    } else {
        selectedMethods.push(tag); // Add tag
    }
    renderChips(allMethodTags, selectedMethods, "method-tags", methodToggle);
    renderPublicationsList();
}

// Fetch publications from cv.json and setup filters
fetch('data/cv.json')
    .then(resp => resp.json())
    .then(data => {
        publications = data.publications || [];
        allSubjectTags = [...new Set(publications.flatMap(pub =>
          Array.isArray(pub.subject_tags) ? pub.subject_tags : []
        ))];
        allMethodTags = [...new Set(publications.flatMap(pub =>
          Array.isArray(pub.method_tags) ? pub.method_tags : []
        ))];

        renderChips(allSubjectTags, selectedSubjects, "subject-tags", subjectToggle); //Render all subject chips
        renderChips(allMethodTags, selectedMethods, "method-tags", methodToggle); //Render all method chips
        renderPublicationsList(); //Render all publications
    });