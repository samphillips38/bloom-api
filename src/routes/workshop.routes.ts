import { Router } from 'express';
import multer from 'multer';
import * as workshopController from '../controllers/workshop.controller';

// Multer: store PDF uploads in memory (max 20 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
});

const router = Router();

// My lessons
router.get('/my-lessons', workshopController.getMyLessons);

// Browse public lessons
router.get('/browse', workshopController.browse);

// Tags
router.get('/tags/popular', workshopController.getPopularTags);
router.get('/tags/:tag/lessons', workshopController.getLessonsByTag);

// CRUD for workshop lessons
router.post('/lessons', workshopController.createLesson);
router.get('/lessons/:id', workshopController.getLesson);
router.put('/lessons/:id', workshopController.updateLesson);
router.delete('/lessons/:id', workshopController.deleteLesson);
router.post('/lessons/:id/publish', workshopController.publishLesson);
router.get('/lessons/:id/play', workshopController.playLesson);
router.post('/lessons/:id/rate', workshopController.rateLesson);

// Modules
router.get('/lessons/:id/modules', workshopController.getModules);
router.post('/lessons/:id/modules', workshopController.createModule);
router.put('/lessons/:id/modules/reorder', workshopController.reorderModules);
router.put('/modules/:mid', workshopController.updateModule);
router.delete('/modules/:mid', workshopController.deleteModule);

// Content pages
router.post('/lessons/:id/content', workshopController.addContent);
router.put('/lessons/:id/content/reorder', workshopController.reorderContent);
router.put('/lessons/:id/content/:cid', workshopController.updateContent);
router.delete('/lessons/:id/content/:cid', workshopController.deleteContent);

// History & metadata
router.get('/lessons/:id/history', workshopController.getHistory);
router.get('/lessons/:id/metadata', workshopController.getMetadata);

// AI generation
router.post('/ai-draft', workshopController.generateAIDraft);
router.post('/ai-plan', workshopController.generateAIPlan);
router.post('/ai-module-content', workshopController.generateAIModuleContent);

// Async AI generation (background job) — multer handles optional PDF binary
router.post('/ai-generate', upload.single('pdf'), workshopController.startAIGeneration);
router.get('/lessons/:id/generation-status', workshopController.getGenerationStatus);

// Edit suggestions
router.post('/lessons/:id/suggest', workshopController.submitSuggestion);
router.get('/lessons/:id/suggestions', workshopController.getSuggestions);
router.put('/suggestions/:sid', workshopController.reviewSuggestion);

export default router;
