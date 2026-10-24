function Footer({
  email = "24cs106@charusat.edu.in",
  name = "Himanshu Varotariya",
  year = "2026",
}) {
  return (
    <footer className="portfolio-footer">
      <div className="section-container footer-container">
        <h2 className="footer-heading">Contact & Connect</h2>
        <p className="footer-description">
          Feel free to reach out for inquiries, collaboration opportunities, or academic discussions.
        </p>
        <div className="footer-contact-info">
          <span className="contact-label">Email:</span>{" "}
          <a href={`mailto:${email}`} className="footer-email-link">
            {email}
          </a>
        </div>
        <hr className="footer-divider" />
        <p className="footer-copyright">
          &copy; {year} {name}. All rights reserved. | ITUE301 Practical 11: Containerization with Docker & Docker Compose
        </p>
      </div>
    </footer>
  );
}

export default Footer;
