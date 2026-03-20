ALTER TABLE games ADD COLUMN image_url TEXT;

UPDATE games SET image_url = '/images/go.jpg' WHERE slug = 'go';
UPDATE games SET image_url = '/images/ragnarocks.jpg' WHERE slug = 'ragnarocks';
UPDATE games SET image_url = '/images/tic-tac-toe.jpg' WHERE slug = 'tic-tac-toe';
UPDATE games SET image_url = '/images/minesweeper.jpg' WHERE slug = 'minesweeper';
