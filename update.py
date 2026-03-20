import re
import os

dir_path = "/home/jade/dev/projects/web/WEB Projects/sorting-simulation"

files = [
    "bubble_sort_simulation.html",
    "selection_sort_simulation.html",
    "insertion_sort_simulation.html"
]

for file_name in files:
    file = os.path.join(dir_path, file_name)
    with open(file, "r") as f:
        content = f.read()

    # 1. Reduce gap between bars and labels
    content = re.sub(r'margin-top:\s*4px;', 'margin-top: 0;', content)
    content = re.sub(r'margin-top:\s*2px;', 'margin-top: 0;', content)
    
    # 2. Add transition to layout
    content = re.sub(
        r'(\.layout\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*300px 1fr 360px;\s*gap:\s*20px;\s*align-items:\s*start;)',
        r'\1\n      transition: grid-template-columns 0.3s ease;',
        content
    )
    
    # 3. Add collapse CSS
    collapse_css = """
    .layout.left-collapsed { grid-template-columns: 50px 1fr 360px; }
    .layout.right-collapsed { grid-template-columns: 300px 1fr 50px; }
    .layout.left-collapsed.right-collapsed { grid-template-columns: 50px 1fr 50px; }
    .layout.left-collapsed .group, .layout.left-collapsed .buttons { display: none; }
    .layout.right-collapsed .group, .layout.right-collapsed .code-panel, .layout.right-collapsed .how { display: none; }
    .layout.left-collapsed .toggle-left, .layout.right-collapsed .toggle-right { writing-mode: vertical-rl; text-orientation: mixed; height: 100px; padding: 5px; cursor: pointer;}
"""
    if ".layout.left-collapsed" not in content:
        content = content.replace("</style>", collapse_css + "</style>")

    # 4. Add minimize toggles in HTML
    if '<button id="toggleLeftBtn"' not in content:
        content = content.replace('<aside class="controls">', '<aside class="controls" id="leftSidebar">\n        <button id="toggleLeftBtn" class="neutral toggle-left" style="margin-bottom: 10px; width: 100%;">Collapse</button>')
        
    if '<button id="toggleRightBtn"' not in content:
        content = content.replace('<aside class="sidebar-right">', '<aside class="sidebar-right" id="rightSidebar">\n        <button id="toggleRightBtn" class="neutral toggle-right" style="margin-bottom: 10px; width: 100%;">Collapse</button>')

    # 5. Add Live code trace toggle and language selector
    code_controls = """
        <div class="group code-controls-group" style="margin-bottom: 10px; display: grid; gap: 8px;">
          <label>Code Language & View</label>
          <div style="display: flex; gap: 8px;">
            <select id="codeLanguage">
              <option value="pseudo">Pseudocode</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
            </select>
            <button id="toggleCodeBtn">Hide Code</button>
          </div>
        </div>
"""
    if 'id="codeLanguage"' not in content:
        content = content.replace('<section class="code-panel">', code_controls + '        <section class="code-panel" id="codePanel">')

    # Add the Javascript functionality
    js_to_add = """
    // UI elements for layout and code toggle
    ui.layout = document.querySelector(".layout");
    ui.toggleLeftBtn = document.getElementById("toggleLeftBtn");
    ui.toggleRightBtn = document.getElementById("toggleRightBtn");
    ui.codeLanguage = document.getElementById("codeLanguage");
    ui.toggleCodeBtn = document.getElementById("toggleCodeBtn");
    ui.codePanel = document.getElementById("codePanel");
    
    let leftCollapsed = false;
    let rightCollapsed = false;
    let codeHidden = false;

    ui.toggleLeftBtn.addEventListener("click", () => {
      leftCollapsed = !leftCollapsed;
      ui.layout.classList.toggle("left-collapsed", leftCollapsed);
      ui.toggleLeftBtn.textContent = leftCollapsed ? "Expand" : "Collapse";
    });

    ui.toggleRightBtn.addEventListener("click", () => {
      rightCollapsed = !rightCollapsed;
      ui.layout.classList.toggle("right-collapsed", rightCollapsed);
      ui.toggleRightBtn.textContent = rightCollapsed ? "Expand" : "Collapse";
      
      // If expanding, show the elements properly
      if(!rightCollapsed) {
        document.querySelectorAll(".layout:not(.right-collapsed) .sidebar-right .group").forEach(el => el.style.display = "");
        if(!codeHidden) ui.codePanel.style.display = "";
        document.querySelector(".layout:not(.right-collapsed) .sidebar-right .how").style.display = "";
      }
    });

    ui.toggleCodeBtn.addEventListener("click", () => {
      codeHidden = !codeHidden;
      ui.codePanel.style.display = codeHidden ? "none" : "";
      ui.toggleCodeBtn.textContent = codeHidden ? "Show Code" : "Hide Code";
    });

    ui.codeLanguage.addEventListener("change", () => {
      buildCodeBlock();
      renderCode(steps[stepIndex]);
    });
"""
    if 'ui.toggleLeftBtn =' not in content:
        content = content.replace('const ui = {', js_to_add + '\n    const ui = {')

    with open(file, "w") as f:
        f.write(content)

print("Updated CSS, HTML and JS structure.")
