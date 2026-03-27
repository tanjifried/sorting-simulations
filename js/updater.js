(function() {
  const LOCAL_VERSION_PATH = 'version.json';
  // NOTE: Classmates should replace this with the actual URL of your raw version.json on GitHub
  const REMOTE_VERSION_URL = 'version.json'; 

  async function checkUpdate() {
    try {
      if (window.location && window.location.protocol === 'file:') {
        return;
      }
      const localRes = await fetch(LOCAL_VERSION_PATH);
      const localData = await localRes.json();
      
      // In a real scenario, this would be a GitHub URL. 
      // For now, we compare against local to demonstrate the UI if version mismatches.
      // To test: Change the version in your local version.json and see if it triggers.
      
      const remoteRes = await fetch(REMOTE_VERSION_URL + '?t=' + Date.now());
      const remoteData = await remoteRes.json();

      if (remoteData.version !== localData.version) {
        showUpdateNotification(remoteData.version);
      }
    } catch (e) {
      // Silently fail if offline or file missing
    }
  }

  function showUpdateNotification(newVersion) {
    const banner = document.createElement('div');
    banner.id = 'sortlab-update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <span class="update-icon">🚀</span>
        <span class="update-text"><b>Update Available!</b> Version ${newVersion} is ready. Run <code>update.bat</code> (Windows) or <code>./update.sh</code> (Mac/Linux) to update.</span>
      </div>
      <button class="update-close" onclick="document.getElementById('sortlab-update-banner').remove()">&times;</button>
    `;
    document.body.prepend(banner);
    
    if (!document.getElementById('update-banner-styles')) {
      const style = document.createElement('style');
      style.id = 'update-banner-styles';
      style.textContent = `
        #sortlab-update-banner {
          background: #6366f1;
          color: white;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Inter', sans-serif;
          z-index: 99999;
          position: sticky;
          top: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          animation: slideDown 0.4s ease-out;
        }
        .update-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .update-icon { font-size: 1.2rem; }
        .update-text { font-size: 0.9rem; }
        .update-text code {
          background: rgba(0,0,0,0.2);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'DM Mono', monospace;
        }
        .update-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.7;
          line-height: 1;
        }
        .update-close:hover { opacity: 1; }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Check on load
  if (document.readyState === 'complete') {
    checkUpdate();
  } else {
    window.addEventListener('load', checkUpdate);
  }
})();
