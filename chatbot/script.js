// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, { threshold: 0.1 });

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Color theme toggle functionality
const themes = [
    // Modern Tech Theme
    {
        primary: '#2563eb',
        secondary: '#3b82f6',
        accent: '#60a5fa',
        gradient1: '#bfdbfe',
        gradient2: '#3b82f6',
        gradient3: '#1d4ed8'
    },
    // Modern Purple Theme
    {
        primary: '#7c3aed',
        secondary: '#8b5cf6',
        accent: '#a78bfa',
        gradient1: '#ddd6fe',
        gradient2: '#8b5cf6',
        gradient3: '#6d28d9'
    },
    // Modern Nature Theme
    {
        primary: '#059669',
        secondary: '#10b981',
        accent: '#34d399',
        gradient1: '#a7f3d0',
        gradient2: '#10b981',
        gradient3: '#047857'
    }
];

let currentTheme = 0;

document.getElementById('theme-toggle').addEventListener('click', () => {
    currentTheme = (currentTheme + 1) % themes.length;
    const theme = themes[currentTheme];
    
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--gradient-1', theme.gradient1);
    document.documentElement.style.setProperty('--gradient-2', theme.gradient2);
    document.documentElement.style.setProperty('--gradient-3', theme.gradient3);
});

// Heading animations on scroll
const headings = document.querySelectorAll('.section-heading');

const headingObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-heading');
      
      // Animate the background text
      const bgText = entry.target.querySelector('.bg-text');
      if (bgText) {
        bgText.style.animation = 'fadeInUp 1s ease forwards';
      }
      
      // Animate the underline
      const underline = entry.target.querySelector('.heading-underline');
      if (underline) {
        underline.style.animation = 'slideInLeft 1s ease forwards';
      }
      
      headingObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.2
});

headings.forEach(heading => {
  headingObserver.observe(heading);
});

// Gradient text animation
document.querySelectorAll('.title').forEach(title => {
  title.addEventListener('mousemove', (e) => {
    const rect = title.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    title.style.setProperty('--x', `${x}px`);
    title.style.setProperty('--y', `${y}px`);
  });
}); 
