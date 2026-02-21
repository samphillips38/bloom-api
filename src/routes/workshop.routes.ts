import { Router } from 'express';
import * as workshopController from '../controllers/workshop.controller';

const router = Router();

// My lessons
router.get('/my-lessons', workshopController.getMyLessons);

// Browse public lessons
router.get('/browse', workshopController.browse);

// CRUD for workshop lessons
router.post('/lessons', workshopController.createLesson);
router.get('/lessons/:id', workshopController.getLesson);
router.put('/lessons/:id', workshopController.updateLesson);
router.delete('/lessons/:id', workshopController.deleteLesson);
router.post('/lessons/:id/publish', workshopController.publishLesson);

// Content pages
router.post('/lessons/:id/content', workshopController.addContent);
router.put('/lessons/:id/content/reorder', workshopController.reorderContent);
router.put('/lessons/:id/content/:cid', workshopController.updateContent);
router.delete('/lessons/:id/content/:cid', workshopController.deleteContent);

// History & metadata
router.get('/lessons/:id/history', workshopController.getHistory);
router.get('/lessons/:id/metadata', workshopController.getMetadata);

// AI draft generation
router.post('/ai-draft', workshopController.generateAIDraft);

// Edit suggestions
router.post('/lessons/:id/suggest', workshopController.submitSuggestion);
router.get('/lessons/:id/suggestions', workshopController.getSuggestions);
router.put('/suggestions/:sid', workshopController.reviewSuggestion);

export default router;
