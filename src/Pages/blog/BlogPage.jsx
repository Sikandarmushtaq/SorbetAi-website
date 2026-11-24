import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock3,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { blogPosts } from "./blogData";
import "./BlogPage.css";

// The exact same BlogCover component is used on the listing and article pages.
export function BlogCover({ post, featured = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={`bbblog-cover bbblog-cover-${post.coverTheme} ${featured ? "bbblog-cover-large" : ""}`}>
      <div className="bbblog-cover-fallback" aria-hidden="true">
        <div className="bbblog-fallback-rings"><MessageCircle size={62} /></div>
        <span>{post.coverEyebrow}</span>
        <strong>{post.coverHeadline}</strong>
      </div>
      {!failed && (
        <img
          src={post.image}
          alt={post.imageAlt}
          className={`bbblog-cover-image ${loaded ? "is-loaded" : ""}`}
          loading={featured ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export default function BlogPage() {
  const [category, setCategory] = useState("All articles");
  const categories = ["All articles", ...new Set(blogPosts.map((post) => post.category))];
  const visiblePosts = category === "All articles"
    ? blogPosts
    : blogPosts.filter((post) => post.category === category);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Blog | Bellbee Ai";
  }, []);

  return (
    <main className="bbblog-page bbblog-list-page">
      <section className="bbblog-hero">
        <div className="bbblog-blob bbblog-blob-a" aria-hidden="true" />
        <div className="bbblog-blob bbblog-blob-b" aria-hidden="true" />
        <div className="bbblog-container bbblog-hero-content">
          <span className="bbblog-eyebrow"><Sparkles size={16} /> THE BELLBEE JOURNAL</span>
          <h1>Big ideas for <em>better conversations.</em></h1>
          <p>Guides, updates, and practical ideas for automating customer conversations on WhatsApp, Instagram and Messenger — straight from the team building Bellbee Ai.</p>
          <div className="bbblog-hero-bottom">
            <span><BookOpen size={17} /> Practical guides</span>
            <span><MessageCircle size={17} /> Customer-first automation</span>
            <span><Sparkles size={17} /> Real business ideas</span>
          </div>
        </div>
      </section>

      <section className="bbblog-list-section">
        <div className="bbblog-container">
          <div className="bbblog-section-heading">
            <div>
              <span className="bbblog-section-label">CURATED READS</span>
              <h2>Explore the <em>latest stories.</em></h2>
            </div>
            <p>Helpful perspectives on messaging, customer experience and growing a responsive business.</p>
          </div>

          <div className="bbblog-categories" role="group" aria-label="Filter blog posts by category">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? "active" : ""}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="bbblog-card-grid">
            {visiblePosts.map((post) => (
              <article className="bbblog-card" key={post.slug}>
                <Link className="bbblog-cover-link" to={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
                  <BlogCover post={post} />
                  <span className="bbblog-cover-corner" aria-hidden="true"><ArrowUpRight size={21} /></span>
                </Link>
                <div className="bbblog-card-content">
                  <div className="bbblog-meta">
                    <span className="bbblog-category">{post.category}</span>
                    <span className="bbblog-meta-date"><CalendarDays size={13} /> {post.date}</span>
                  </div>
                  <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
                  <p>{post.excerpt}</p>
                  <div className="bbblog-card-footer">
                    <span className="bbblog-readtime"><Clock3 size={15} /> {post.readTime}</span>
                    <Link className="bbblog-readmore" to={`/blog/${post.slug}`}>
                      <span>Read more</span><span className="bbblog-readmore-icon"><ArrowRight size={18} /></span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bbblog-cta-section">
        <div className="bbblog-container">
          <div className="bbblog-cta">
            <div>
              <span className="bbblog-cta-kicker"><Sparkles size={15} /> MAKE EVERY CONVERSATION COUNT</span>
              <h2>Ready to reply <em>without the wait?</em></h2>
              <p>Start with free credit. No credit card required.</p>
            </div>
            <Link to="/signup" className="bbblog-primary-btn">Start with free credit <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
