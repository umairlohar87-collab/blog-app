// Seeds demo users, posts, and comments. Idempotent: does nothing if any users exist.
const bcrypt = require('bcrypt');
const db = require('../models/db');

const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (existing > 0) {
  console.log(`Seed skipped: ${existing} user(s) already exist.`);
  process.exit(0);
}

const hash = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(
  'INSERT INTO users (username, email, password_hash, bio) VALUES (?, ?, ?, ?)'
);
const insertPost = db.prepare(
  `INSERT INTO posts (title, content, cover_image, tags, author_id, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))`
);
const insertComment = db.prepare(
  'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)'
);

const paragraphs = (...ps) => ps.join('\n\n');

db.transaction(() => {
  const alice = insertUser.run(
    'alice', 'alice@example.com', hash,
    'Frontend engineer writing about React, CSS, and the craft of building interfaces.'
  ).lastInsertRowid;
  const bob = insertUser.run(
    'bob', 'bob@example.com', hash,
    'Backend developer. Databases, APIs, and the occasional hot take on testing.'
  ).lastInsertRowid;

  const posts = [
    {
      title: 'Getting Started with React Hooks',
      content: paragraphs(
        'Hooks changed the way we write React components. Instead of classes and lifecycle methods, we compose behaviour from small functions.',
        'useState gives a component memory. useEffect lets it synchronize with the outside world. Together they cover most of what class components used to do.',
        'The two rules of hooks are simple: only call them at the top level, and only call them from React functions. Follow those and the rest falls into place.'
      ),
      cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200',
      tags: 'react,javascript,frontend', author: alice, status: 'published', age: '-6 days',
    },
    {
      title: 'Why SQLite Is Enough for Most Side Projects',
      content: paragraphs(
        'Every new project seems to start with a debate about which database cluster to provision. For most side projects, the answer is: none.',
        'SQLite is a single file, needs no server, and handles thousands of writes per second on modest hardware. With WAL mode enabled, readers never block writers.',
        'When you outgrow it, you will know, and migrating a well-structured schema is not hard.'
      ),
      cover: '', tags: 'databases,sqlite,backend', author: bob, status: 'published', age: '-4 days',
    },
    {
      title: 'Modern CSS Layout: Grid vs Flexbox',
      content: paragraphs(
        'Flexbox is one-dimensional: it lays items out along a single axis. Grid is two-dimensional: rows and columns at once.',
        'A good rule of thumb: reach for Flexbox for components (a navbar, a button group) and Grid for page layout (a card gallery, a dashboard).',
        'repeat(auto-fill, minmax(300px, 1fr)) is probably the most useful line of CSS written this decade.'
      ),
      cover: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=1200',
      tags: 'css,frontend,design', author: alice, status: 'published', age: '-2 days',
    },
    {
      title: 'Designing REST APIs People Enjoy Using',
      content: paragraphs(
        'A good API is predictable. Nouns for resources, HTTP verbs for actions, and status codes that mean what they say.',
        'Return the same error shape everywhere. Validate input at the edge. Paginate list endpoints from day one, because retrofitting pagination is painful.',
        'Most importantly: write the docs table before you write the code.'
      ),
      cover: '', tags: 'api,backend,javascript', author: bob, status: 'published', age: '-1 days',
    },
    {
      title: 'Thoughts on State Management (draft)',
      content: paragraphs(
        'This is a work in progress. Context, reducers, external stores: when does each make sense?',
        'Notes to self: compare useReducer + context against a small external store, and measure re-renders.'
      ),
      cover: '', tags: 'react,state', author: alice, status: 'draft', age: '-3 hours',
    },
  ];

  const ids = posts.map((p) =>
    insertPost.run(p.title, p.content, p.cover, p.tags, p.author, p.status, p.age, p.age).lastInsertRowid
  );

  insertComment.run(ids[0], bob, 'Great intro! The rules-of-hooks section is spot on.');
  insertComment.run(ids[1], alice, 'Totally agree. I ship SQLite in production for small apps.');
  insertComment.run(ids[2], bob, 'auto-fill + minmax is magic.');
})();

console.log('Seeded 2 users (alice / bob, password: password123), 5 posts (1 draft), 3 comments.');
