// 🔧 Multer config with error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Ensure the directory exists
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
}).single('image'); // Only single image upload

// Add the Multer middleware and custom error handler
router.post('/add', (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      // Generic errors
      return res.status(500).json({ error: `Upload error: ${err.message}` });
    }

    try {
      const { name, category, price, description } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Image is required' });
      }

      const newFood = new Food({
        name,
        category,
        price,
        description,
        image: req.file.filename, // Store image filename
      });

      await newFood.save();
      res.status(201).json(newFood); // Success response
    } catch (err) {
      console.error('Error saving food item:', err);
      res.status(500).json({ error: 'Failed to add food item' });
    }
  });
});
