import React, { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";
import { blogPosts } from "./blogData";
import { BlogCover } from "./BlogPage";
import "./BlogPage.css";

const idFor = (heading, index) =>
  `section-${index + 1}-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find((item) => item.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = post ? `${post.title} | Bellbee Ai` : "Blog | Bellbee Ai";
  }, [slug, post]);

  if (!post) return <Navigate to="/blog" replace />;

  const otherPosts = blogPosts.filter((item) => item.slug !== post.slug);

  return (
    <main className="bbblog-page bbblog-detail-page">
      <section className="bbblog-detail-hero">
        <div className="bbblog-blob bbblog-blob-a" aria-hidden="true" />
        <div className="bbblog-blob bbblog-blob-b" aria-hidden="true" />
        <div className="bbblog-container">
          <Link to="/blog" className="bbblog-back-link"><ArrowLeft size={17} /> Back to blogs</Link>
          <div className="bbblog-detail-hero-grid">
            <div className="bbblog-detail-hero-copy">
              <div className="bbblog-meta">
                <span className="bbblog-category">{post.category}</span>
                <span className="bbblog-meta-date"><CalendarDays size={14} /> {post.date}</span>
              </div>
              <h1>{post.title}</h1>
              <p>{post.excerpt}</p>
              <span className="bbblog-detail-reading"><Clock3 size={17} /> {post.readTime} <span>·</span> Bellbee Journal</span>
            </div>
            <div className="bbblog-detail-cover-wrap">
              <BlogCover key={post.slug} post={post} featured />
              <span className="bbblog-detail-cover-badge"><Sparkles size={16} /> Insights for growing teams</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bbblog-article-section">
        <div className="bbblog-container bbblog-article-layout">
          <article className="bbblog-article">
            <p className="bbblog-lead">{post.intro}</p>
            {post.sections.map((section, index) => (
              <section className="bbblog-article-section-block" key={section.heading} id={idFor(section.heading, index)}>
                <div className="bbblog-section-number">{String(index + 1).padStart(2, "0")}</div>
                <h2>{section.heading}</h2>
                {section.paragraphs?.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)}
                {section.bullets?.length > 0 && (
                  <ul>{section.bullets.map((item, idx) => <li key={idx}><CheckCircle2 size={17} /><span>{item}</span></li>)}</ul>
                )}
              </section>
            ))}

            {post.faqs?.length > 0 && (
              <section className="bbblog-article-section-block" id="frequently-asked-questions">
                <div className="bbblog-section-number">FAQ</div>
                <h2>Frequently asked questions</h2>
                <div className="bbblog-article-faqs">
                  {post.faqs.map(([q, a]) => (
                    <details key={q}>
                      <summary>{q}<ChevronRight size={18} /></summary>
                      <p>{a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            <div className="bbblog-article-end">
              <Sparkles size={21} />
              <div><strong>Want to put these ideas into practice?</strong><p>Discover how Bellbee can help your team respond to customers.</p></div>
              <Link to="/pricing">Explore pricing <ArrowUpRight size={17} /></Link>
            </div>
            <div className="bbblog-article-bottom-back">
              <Link to="/blog" className="bbblog-back-link"><ArrowLeft size={17} /> Back to blogs</Link>
              <Link to="/signup" className="bbblog-primary-btn">Start with free credit <ArrowRight size={17} /></Link>
            </div>
          </article>

          <aside className="bbblog-sidebar" aria-label="Article navigation">
            <div className="bbblog-toc">
              <span className="bbblog-toc-label"><BookOpen size={17} /> IN THIS ARTICLE</span>
              <nav aria-label="On this page">
                {post.sections.map((section, index) => (
                  <a key={section.heading} href={`#${idFor(section.heading, index)}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>{section.heading}
                  </a>
                ))}
                <a href="#frequently-asked-questions"><span>FAQ</span>Frequently asked questions</a>
              </nav>
            </div>
          </aside>
        </div>
      </section>

      <section className="bbblog-other-section">
        <div className="bbblog-container">
          <div className="bbblog-other-heading"><div><span className="bbblog-section-label">KEEP READING</span><h2>More stories <em>worth exploring.</em></h2></div><Link to="/blog">View all blogs <ArrowRight size={17} /></Link></div>
          <div className="bbblog-other-grid">
            {otherPosts.map((item) => (
              <Link className="bbblog-other-card" to={`/blog/${item.slug}`} key={item.slug}>
                <BlogCover post={item} />
                <div><span>{item.category} · {item.readTime}</span><h3>{item.title}</h3><strong>Read article <ArrowUpRight size={16} /></strong></div>
              </Link>
            ))}
          </div>
          <Link to="/blog" className="bbblog-back-link bbblog-last-back"><ArrowLeft size={17} /> Back to blogs</Link>
        </div>
      </section>
    </main>
  );
}
