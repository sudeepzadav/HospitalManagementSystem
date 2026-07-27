export const SYMPTOM_KEYWORDS = {
  cardiology: ["heart", "chest pain", "palpitation", "blood pressure", "cardiac"],
  dermatology: ["skin", "rash", "acne", "itch", "eczema"],
  orthopedics: ["bone", "fracture", "joint", "back pain", "knee", "shoulder", "sprain"],
  pediatrics: ["child", "baby", "infant", "kid", "toddler"],
  neurology: ["headache", "migraine", "seizure", "numbness", "dizziness", "nerve"],
  ent: ["ear", "nose", "throat", "sinus", "hearing"],
  ophthalmology: ["eye", "vision", "blurry", "sight"],
  gastroenterology: ["stomach", "abdominal", "digestion", "nausea", "vomit", "acidity"],
  gynecology: ["pregnan", "menstrual", "period", "gynae"],
  psychiatry: ["anxiety", "depression", "stress", "sleep", "mental"],
  general: ["fever", "cold", "cough", "flu", "general checkup"],
};

export function matchDepartment(text, availableDepartments) {
  const lowerText = text.toLowerCase();
  for (const dept of availableDepartments) {
    const keywords = SYMPTOM_KEYWORDS[dept.toLowerCase()];
    if (keywords && keywords.some((kw) => lowerText.includes(kw))) return dept;
  }
  return null;
}