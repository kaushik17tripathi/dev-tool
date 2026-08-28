import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ExternalLink, Github, Mail, Linkedin } from "lucide-react";

export default function Portfolio() {
  const [activeProject, setActiveProject] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -80]);

  const stats = [
    { label: "Projects Shipped", value: "15+", icon: "🚀" },
    { label: "Performance Gains", value: "35%+", icon: "⚡" },
    { label: "API Optimizations", value: "10+", icon: "🔄" },
    { label: "Years Experience", value: "1.5+", icon: "📅" },
  ];

  const projects = [
    {
      title: "Shipping Tax System",
      stack: ["React", "Node", "MongoDB"],
      impact: "40% reduction in manual tax processing",
      details: "Designed rule-based system handling 50+ enterprise clients. Automated complex tax workflows with modular, scalable architecture.",
      category: "backend",
      metrics: ["50+ clients", "40% faster", "Rule-based engine"],
      link: "#",
    },
    {
      title: "Insurance Platform",
      stack: ["React", "Redux", "API"],
      impact: "35% load time reduction, 28% fewer API calls",
      details: "Optimized React rendering patterns and consolidated API endpoints. Implemented smart caching and component memoization.",
      category: "frontend",
      metrics: ["35% faster", "-28% API calls", "Redux optimization"],
      link: "#",
    },
    {
      title: "Real Estate Platform",
      stack: ["Next.js", "Node", "PostgreSQL"],
      impact: "Handles 10k+ monthly listings, 45% DB optimization",
      details: "Built scalable backend with PostgreSQL. Implemented Redis caching layer for frequent queries. Enhanced broker workflows.",
      category: "fullstack",
      metrics: ["10k+ listings", "-45% queries", "Redis cache"],
      link: "#",
    },
  ];

  const technologies = [
    { name: "React", level: "Expert", year: 2023, color: "#61dafb" },
    { name: "Next.js", level: "Advanced", year: 2024, color: "#000000" },
    { name: "Node.js", level: "Advanced", year: 2023, color: "#68a063" },
    { name: "TypeScript", level: "Advanced", year: 2024, color: "#3178c6" },
    { name: "PostgreSQL", level: "Intermediate", year: 2024, color: "#336791" },
    { name: "MongoDB", level: "Intermediate", year: 2023, color: "#13aa52" },
    { name: "AWS", level: "Intermediate", year: 2024, color: "#ff9900" },
    { name: "Docker", level: "Intermediate", year: 2024, color: "#2496ed" },
  ];

  const caseStudies = [
    {
      id: 1,
      title: "Tax Automation Engine: From Manual to Intelligent",
      overview: "How we reduced enterprise tax processing by 40%",
      challenge: "Enterprise clients were manually processing complex tax rules, leading to errors and delays.",
      solution: "Built a rule-based system with hierarchical logic and modular components.",
      results: ["40% reduction in manual work", "Serves 50+ enterprise clients", "Maintained scalability"],
      stack: ["React", "Node.js", "MongoDB", "REST APIs"],
    },
    {
      id: 2,
      title: "Real Estate Platform: Scaling from 1k to 10k+ Listings",
      overview: "Architecting systems for 10x growth",
      challenge: "Platform struggled with slow queries and inefficient data fetching as listings grew.",
      solution: "Implemented PostgreSQL optimization, Redis caching, and query indexing strategies.",
      results: ["45% reduction in DB queries", "Sub-100ms response times", "Support for 10k+ listings"],
      stack: ["Next.js", "Node.js", "PostgreSQL", "Redis"],
    },
  ];

  const milestones = [
    { year: 2022, title: "SDE Intern @ Agprop", desc: "Vue.js modules & API integrations", skills: ["Vue.js", "REST APIs"] },
    { year: 2023, title: "React Deep Dive", desc: "Performance optimization & state management", skills: ["React", "Redux"] },
    { year: 2024, title: "Backend Specialist", desc: "Node.js, PostgreSQL, system design", skills: ["Node.js", "PostgreSQL", "System Design"] },
    { year: 2025, title: "Full Stack @ TO THE NEW", desc: "Multiple platform scaling & production systems", skills: ["React", "Next.js", "Node.js"] },
  ];

  const testimonials = [
    {
      text: "Kapil has a strong grasp of full-stack development. His approach to system design and scalability is mature.",
      author: "Manager @ TO THE NEW",
      role: "Engineering Lead",
    },
    {
      text: "Consistently delivers clean code and takes ownership of complex features. A rare combination of frontend and backend skills.",
      author: "Peer Developer",
      role: "Senior Engineer",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-x-hidden">
      {/* ===== ANIMATED BACKGROUND ===== */}
      <motion.div style={{ y }} className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-purple-600/15 blur-3xl rounded-full animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-[500px] h-[500px] bg-indigo-600/15 blur-3xl rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-3xl rounded-full" />
      </motion.div>

      {/* ===== HERO SECTION ===== */}
      <section className="relative z-10 pt-40 pb-32 px-6 text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400 mb-6 leading-tight">
            Building Systems, Not Just Apps
          </h1>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
          Full Stack Engineer focused on <span className="text-purple-300 font-semibold">scalable architectures</span>, <span className="text-purple-300 font-semibold">clean code</span>, and <span className="text-purple-300 font-semibold">real-world impact</span>.
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-sm text-gray-400 mb-10">
          Currently @ TO THE NEW | 1.5+ years shipping production systems
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex justify-center gap-4 flex-wrap">
          <a href="#projects" className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition font-semibold">
            Explore Work
          </a>
          <a href="#contact" className="px-6 py-3 border border-purple-400/50 rounded-xl hover:bg-purple-500/20 transition font-semibold">
            Get in Touch
          </a>
          <a href="#case-studies" className="px-6 py-3 border border-white/20 rounded-xl hover:bg-white/10 transition">
            Case Studies
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: [0, 10, 0] }} transition={{ delay: 1.5, duration: 2, repeat: Infinity }} className="mt-16">
          <ChevronDown className="mx-auto text-purple-400" size={28} />
        </motion.div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="p-6 bg-gradient-to-br from-white/10 to-white/5 border border-purple-500/30 rounded-2xl text-center">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold text-purple-300 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== WHAT I DO ===== */}
      <section className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">What I Do</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Frontend Engineering", desc: "Fast, responsive UIs with React & Next.js. Focus on performance, accessibility, and user experience.", icon: "⚛️" },
            { title: "Backend Systems", desc: "Scalable APIs with Node.js. Database design, optimization, and complex business logic handling.", icon: "⚙️" },
            { title: "System Thinking", desc: "End-to-end architecture design. Breaking problems into maintainable, scalable, production-ready systems.", icon: "🏗️" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -12, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.2)" }} className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== EXPERIENCE ===== */}
      <section className="relative z-10 py-24 px-6 max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16">Experience</h2>

        <div className="space-y-6">
          {[
            {
              role: "Software Engineer · TO THE NEW",
              period: "Jul 2025 - Present",
              type: "Full-time",
              points: [
                "Architected rule-based tax engine serving 50+ enterprise clients; 40% reduction in manual processing",
                "Optimized React component rendering & API patterns; 35% load time reduction, 28% fewer API calls",
                "Built Real Estate Platform backend handling 10k+ listings; implemented Redis caching (45% DB query reduction)",
              ],
            },
            {
              role: "Software Developer Trainee · TO THE NEW",
              period: "Jan - Jul 2025",
              type: "Internship",
              points: [
                "Migrated legacy Vue.js modules to React; shipped 5+ features for 1k+ end users",
                "Reduced API response time by 22% through query optimization and Redis implementation",
              ],
            },
            {
              role: "SDE Intern · Agprop",
              period: "Nov 2022 - Mar 2024",
              type: "Internship",
              points: [
                "Developed 3 core Vue.js features for customer dashboard; 18% page load improvement via code splitting",
                "Implemented REST API integrations; reduced data-fetching errors by 60%",
              ],
            },
          ].map((exp, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(139, 92, 246, 0.15)" }} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold">{exp.role}</h3>
                  <p className="text-sm text-purple-300">{exp.period}</p>
                </div>
                <span className="px-3 py-1 bg-purple-500/30 rounded-full text-xs text-purple-200">{exp.type}</span>
              </div>
              <ul className="text-gray-300 text-sm space-y-2">
                {exp.points.map((p, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-purple-400 flex-shrink-0">→</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== PROJECTS ===== */}
      <section id="projects" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-6">Projects & Impact</h2>
          <p className="text-center text-gray-400 mb-12">Outcomes over code—here's what shipped and what changed</p>

          {/* Filter tabs */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            {["all", "frontend", "backend", "fullstack"].map((tab) => (
              <motion.button key={tab} onClick={() => setActiveTab(tab)} whileHover={{ scale: 1.05 }} whileActive={{ scale: 0.95 }} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? "bg-purple-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {projects.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -16, boxShadow: "0 25px 50px rgba(139, 92, 246, 0.3)" }} className="p-7 bg-gradient-to-br from-white/10 to-white/5 border border-purple-500/30 rounded-2xl cursor-pointer backdrop-blur group" onClick={() => setActiveProject(p)}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold flex-1">{p.title}</h3>
                  <ExternalLink className="opacity-0 group-hover:opacity-100 transition text-purple-400" size={20} />
                </div>
                <p className="text-sm text-purple-300 font-semibold mb-4">{p.impact}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {p.stack.map((s) => (
                    <motion.span key={s} whileHover={{ scale: 1.1 }} className="text-xs px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-200">
                      {s}
                    </motion.span>
                  ))}
                </div>

                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{p.details}</p>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    {p.metrics.map((m, idx) => (
                      <span key={idx} className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CASE STUDIES ===== */}
      <section id="case-studies" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Deep Dives: How & Why</h2>

          <div className="space-y-8">
            {caseStudies.map((study, i) => (
              <motion.div key={study.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-purple-500/20 rounded-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">🎯</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{study.title}</h3>
                    <p className="text-purple-300 text-sm">{study.overview}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-300 mb-2 uppercase tracking-wider">Challenge</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{study.challenge}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-300 mb-2 uppercase tracking-wider">Solution</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{study.solution}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-300 mb-2 uppercase tracking-wider">Results</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      {study.results.map((r, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-purple-400">✓</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex gap-2 flex-wrap">
                    {study.stack.map((tech) => (
                      <span key={tech} className="text-xs px-3 py-1 bg-purple-500/10 border border-purple-400/30 rounded-full text-purple-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECH TIMELINE ===== */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Technical Journey</h2>

          <div className="space-y-8">
            {milestones.map((milestone, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} className="flex gap-8 items-center">
                <div className="hidden md:flex flex-col items-center gap-4 flex-shrink-0">
                  <motion.div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 ring-4 ring-purple-500/30" whileHover={{ scale: 1.5 }} />
                  {i < milestones.length - 1 && <div className="w-1 h-20 bg-gradient-to-b from-purple-500 to-transparent" />}
                </div>

                <motion.div whileHover={{ scale: 1.02 }} className="flex-1 p-6 bg-gradient-to-br from-white/10 to-white/5 border border-purple-500/30 rounded-2xl">
                  <div className="text-sm text-purple-300 font-semibold mb-1">{milestone.year}</div>
                  <h4 className="text-xl font-bold mb-2">{milestone.title}</h4>
                  <p className="text-gray-400 text-sm mb-3">{milestone.desc}</p>
                  <div className="flex gap-2 flex-wrap">
                    {milestone.skills.map((skill) => (
                      <span key={skill} className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-purple-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CORE STACK ===== */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Core Stack & Expertise</h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Proficiency levels */}
            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-300">Proficiency</h3>
              <div className="space-y-4">
                {[
                  { name: "React", level: 95 },
                  { name: "Node.js", level: 90 },
                  { name: "TypeScript", level: 88 },
                  { name: "Next.js", level: 85 },
                  { name: "Database Design", level: 82 },
                  { name: "System Architecture", level: 80 },
                ].map((skill, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold">{skill.name}</span>
                      <span className="text-xs text-purple-300">{skill.level}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.level}%` }} transition={{ duration: 1, delay: i * 0.05 }} className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tech grid */}
            <div>
              <h3 className="text-xl font-semibold mb-6 text-purple-300">Technologies</h3>
              <div className="grid grid-cols-2 gap-3">
                {["React", "Next.js", "Node.js", "TypeScript", "MongoDB", "PostgreSQL", "AWS", "Kafka", "Redis", "Docker", "Express", "REST APIs"].map((tech, i) => (
                  <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.08, boxShadow: "0 8px 16px rgba(139, 92, 246, 0.2)" }} className="p-4 bg-gradient-to-br from-white/10 to-white/5 border border-purple-500/30 rounded-xl text-center cursor-pointer">
                    <div className="font-semibold text-sm">{tech}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">What Colleagues Say</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.2)" }} className="p-8 bg-gradient-to-br from-purple-500/10 to-white/5 border border-purple-500/30 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-200 leading-relaxed mb-6 italic">"{testimonial.text}"</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-purple-300">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BEYOND CODE ===== */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Beyond Code</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "☕ Coffee & Deep Work", desc: "Building focus rituals. Late-night debugging fuel. Complex problem marathons.", icon: "🧠" },
              { title: "🎮 Strategic Gaming", desc: "Competitive mindset. System analysis. Decision-making under pressure.", icon: "🏆" },
              { title: "🏓 Table Tennis", desc: "Fast reflexes. Adaptability. Same energy channeled into debugging.", icon: "⚡" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.05 }} className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl">
                <div className="text-5xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section id="contact" className="relative z-10 py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              Let's Build Something
            </h2>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-gray-300 mb-12">
            Open to fullstack roles, backend challenges, or scaling ambitious projects. Let's talk.
          </motion.p>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex justify-center gap-4 flex-wrap mb-12">
            <a href="mailto:kapilsinghrathore@gmail.com" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition font-semibold">
              <Mail size={20} /> Email
            </a>
            <a href="https://linkedin.com/in/kapil-singh-rathore-42443a22a" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition font-semibold">
              <Linkedin size={20} /> LinkedIn
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition font-semibold">
              <Github size={20} /> GitHub
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }} className="p-8 bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/30 rounded-2xl">
            <p className="text-sm text-gray-300 mb-4">📍 Open to: Full-time roles • Startups • Remote/On-site</p>
            <p className="text-xs text-gray-400">Response time: Usually within 24 hours</p>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10 text-center text-gray-400 text-sm">
        <p>© 2025 Kapil Singh Rathore. Crafted with React, Framer Motion & attention to detail.</p>
      </footer>
    </div>
  );
}
