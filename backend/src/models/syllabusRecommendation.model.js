import mongoose from 'mongoose';

const improvementItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const studyPlanWeekSchema = new mongoose.Schema({
  week: { type: String, required: true },   // e.g. "Week 1"
  title: { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const syllabusRecommendationSchema = new mongoose.Schema({
  branch: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,          // e.g. "ECE", "BBA"
  },
  semester: {
    type: Number,
    required: true,      // e.g. 4 for ECE 4th sem, 2 for BBA 2nd sem
  },
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,          // e.g. "ECC210", "BBA102"
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  credits: {
    type: Number,
    default: 3,
  },
  // AI mentor content
  insight: {
    type: String,
    required: true,
  },
  weakAreas: [String],
  strengths: String,
  improvementPlan: [improvementItemSchema],  // "Help me improve" modal
  studyPlan: [studyPlanWeekSchema],          // "3-week study plan" modal
  // Key topics from syllabus
  topics: [String],
}, {
  timestamps: true,
});

// Unique index per branch+semester+subjectCode
syllabusRecommendationSchema.index(
  { branch: 1, semester: 1, subjectCode: 1 },
  { unique: true }
);

const SyllabusRecommendation = mongoose.model('SyllabusRecommendation', syllabusRecommendationSchema);

export default SyllabusRecommendation;
