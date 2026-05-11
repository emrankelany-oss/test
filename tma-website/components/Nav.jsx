function Nav() {
  return (
    <nav className="nav">
      <a href="#top" className="nav-logo" aria-label="The Motion Agency — home">
        <img className="nav-logo-img light" src="assets/tma-logo-white.png?v=2" alt="" />
        <img className="nav-logo-img dark"  src="assets/tma-logo-black.png?v=2" alt="" />
      </a>
      <div className="nav-links">
        <a href="#proof">Case Studies</a>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#insights">Insights</a>
        <a href="#careers">Careers</a>
      </div>
      <a href="#contact" className="nav-cta">
        <span className="nav-dot" />
        Start a project
      </a>
    </nav>
  );
}
window.Nav = Nav;
