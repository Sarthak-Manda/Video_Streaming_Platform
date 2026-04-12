function Header({ user, onLogout, onNavigate }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        
        <div className="logo" onClick={() => onNavigate('home')}>
          <span className="logo-play">▶</span>
          <span className="logo-text">VideoStream</span>
        </div>
        
        <div className="search-bar">
          <input type="text" placeholder="Search videos..." />
          <button className="search-btn">🔍</button>
        </div>

        <div className="header-actions">
          {user ? (
            <>
              <button className="upload-btn" onClick={() => onNavigate('upload')}>
                📤 Upload
              </button>
              
              <div className="user-menu">
                <button 
                  className="user-avatar"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  {user.username.charAt(0).toUpperCase()}
                </button>
                
                {showMenu && (
                  <div className="dropdown-menu">
                    <button onClick={() => onNavigate('profile')}>My Channel</button>
                    <button onClick={() => onNavigate('library')}>My Videos</button>
                    <hr />
                    <button onClick={onLogout}>Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => onNavigate('login')}>
                Sign In
              </button>
              <button className="btn-primary" onClick={() => onNavigate('register')}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}  