/**
 * One-time setup: creates every tab (if missing) with the correct header
 * row, and seeds the Parent Concern taxonomy + other master-data lists as
 * rows in their own tabs (so Admin can edit them straight in the sheet).
 *
 * Usage: npm run setup:sheet
 */
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

const TABS: Record<string, string[]> = {
  Students: ['id', 'studentCode', 'name', 'nameVariants', 'branch', 'class', 'section', 'dateOfBirth', 'parentName', 'parentEmail', 'parentPhone', 'admissionDate', 'status'],
  Teachers: ['id', 'email', 'passwordHash', 'name', 'role', 'branch', 'assignedClass', 'assignedSection', 'isActive'],
  Assessments: [
    'id', 'studentId', 'weekStartDate', 'assessmentDate', 'workingDays', 'daysPresent', 'attendancePct', 'status',
    'parentConcernCodes', 'parentConcernSigns', 'parentConcernSchoolSupport', 'parentConcernHomeTips', 'parentConcernNote',
    'socialEmotional', 'learningReadiness', 'language', 'maths', 'concepts',
    'letterRecognition', 'numberRecognition', 'shapeRecognition', 'colourRecognition',
    'mostEnjoyedActivity', 'weeklyStarMoment', 'focusAreas', 'schoolActivities', 'homeActivities', 'teacherNote',
    'createdBy', 'createdAt', 'lastModifiedBy', 'updatedAt', 'isDeleted', 'deletedBy', 'deletedAt',
  ],
  ParentConcerns: ['code', 'title', 'signs', 'normalByAge', 'schoolSupports', 'homeTips', 'linkedFocusAreas'],
  MasterLists: ['listName', 'label', 'sortOrder'],
  AuditLog: ['id', 'userEmail', 'entityType', 'entityId', 'action', 'changes', 'createdAt'],
  ReportAcknowledgements: ['id', 'assessmentId', 'reply', 'createdAt'],
  CustomQuestions: ['id', 'label', 'type', 'options', 'points', 'sortOrder', 'isActive', 'parentQuestionId', 'triggerOption'],
  CustomAnswers: ['id', 'assessmentId', 'questionId', 'answer'],
};

const CONCERNS = [
  ['ATTENTION_SPAN', 'Attention Span Difficulty',
    'Gets distracted easily|Leaves activity in between|Needs constant reminders',
    '2 yrs:4-6 min|3 yrs:6-9 min|4 yrs:8-12 min|5 yrs:10-15 min|6 yrs:12-18 min',
    'Circle time routines|Short, engaging activities|Fine motor work (beads, clay, puzzles)|Phonics & rhyme repetition|Storytelling with questions',
    'Keep activities short & meaningful|Reduce screen time|Provide a quiet space|Praise effort & focus|Maintain a routine',
    'Attention and concentration|Attention and sitting tolerance'],
  ['SOCIALIZING', 'Socializing Difficulty',
    'Prefers to play alone|Shy or avoids group activities|Takes time to warm up|Difficulty sharing or taking turns',
    '2-3 yrs:Parallel play is normal|3-4 yrs:Begins group play|4-5 yrs:Makes friends & enjoys group activities',
    'Circle time & group songs|Sharing activities|Role play|Storytelling & discussions|Structured classroom routines',
    'Arrange playdates|Encourage greeting habits|Teach sharing gently|Read stories about friendship|Avoid forcing interaction',
    'Social skills'],
  ['SPEECH_DELAY', 'Speech Delay / Communication Hesitation',
    'Limited words|Does not form sentences|Hesitates to speak in group|Not able to express needs clearly',
    '2 yrs:50-200 words|3 yrs:2-3 word sentences|4 yrs:4-5 word sentences|5 yrs:Talks in complete sentences',
    'Phonics & vocabulary building|Rhyme time|Storytelling & show and tell|Circle conversation practice|Individual attention',
    'Talk to your child often|Read picture books together|Encourage expressing needs|Limit screen time|Be patient & listen',
    'Communication'],
  ['SEPARATION_ANXIETY', 'Separation Anxiety',
    'Cries at drop-off|Seeks constant reassurance|Fear of new environment',
    '2-4 yrs:Very common',
    'Warm greeting & goodbye routine|Comfort transition time|Predictable schedule|Teacher bonding|Peer exposure',
    'Develop a goodbye routine|Keep goodbyes short & positive|Be consistent|Talk positively about school',
    'Confidence building'],
  ['PENCIL_GRIP', 'Poor Pencil Grip / Writing Readiness',
    'Weak grip|Poor control while drawing|Difficult to trace lines or shapes',
    '2-3 yrs:Scribbles|3-4 yrs:Random shapes & lines|4-5 yrs:Traces simple shapes|5-6 yrs:Ready for early writing',
    'Fine motor activities (beads, threading, clay, tearing)|Tracing lines & shapes|Coloring & pattern activities|Pre-writing strokes',
    'Provide crayons, clay, playdough|Encourage coloring & tracing|Avoid forcing writing|Let them do daily self-help tasks',
    'Fine motor skills'],
  ['HYPERACTIVITY', 'Hyperactivity / Restlessness',
    'Constant movement|Cannot follow instructions|Interrupts activities|Short attention span',
    'Preschool years:High energy is normal; improves with age & structured routine',
    'Movement breaks|Action songs & yoga|Task-based activities|Structured routine|Positive guidance & redirection',
    'Provide physical play time|Set clear limits|Give simple instructions|Praise good behavior',
    'Attention and concentration|Following instructions'],
  ['CONFIDENCE', 'Lack of Confidence / Stage Fear',
    'Shy in group|Avoids participation|Silent during presentations',
    '2-5 yrs:Shyness is common; confidence grows with exposure & support',
    'Show and tell|Rhyme recitation|Role play|Appreciation & encouragement|Small group interactions',
    "Encourage, don't push|Give choices|Celebrate small achievements|Expose to small gatherings",
    'Confidence building'],
  ['FOLLOWING_INSTRUCTIONS', 'Difficulty Following Instructions',
    "Doesn't respond|Gets distracted|Forgets quickly|Needs constant repeating",
    'Preschool:Understanding improves with age; short & simple instructions work best',
    'Visual instructions|Simple, one-step directions|Repetition with routine|Positive reinforcement',
    'Give clear instructions|Use visual cues|Be consistent|Praise when they follow',
    'Following instructions'],
  ['SCREEN_DEPENDENCY', 'Screen Dependency',
    'Difficulty without screens|Irritable when screen time stops|Less interest in other activities',
    'Under 2 yrs:No screen needed|2-5 yrs:<1 hour/day of quality content',
    'Engaging activities|Peer interaction|Sensory & movement play|Storytelling & creative learning',
    'Set screen time limits|Offer healthy snacks & water|Encourage outdoor & creative play|Involve in family time',
    ''],
];

const MASTER_LISTS: Record<string, string[]> = {
  SocialEmotional: ['Interaction with peers', 'Shares and cooperates', 'Expresses emotions', 'Confidence level'],
  LearningReadiness: ['Attention and sitting tolerance', 'Following instructions', 'Fine motor skills', 'Problem solving', 'Self-help skills'],
  FocusAreas: ['Communication', 'Social skills', 'Fine motor skills', 'Confidence building', 'Attention and concentration', 'Attention and sitting tolerance', 'Following instructions', 'Problem solving', 'Self-help skills', 'Other'],
  SchoolActivities: ['Beads/pompom transfer', 'Rhymes repetition', 'Show and tell', 'Storytelling', 'Alphabet tracing', 'Sand writing', 'Workbook activities', 'One-step instruction activities'],
  HomeActivities: ['Read picture books together', 'Practice alphabet recognition', 'Practice numbers using household objects', 'Encourage expressing needs', 'Beads/seeds transfer activity', 'Storytelling with open-ended questions'],
  Branches: ['Not Assigned'],
  Classes: ['Not Assigned'],
  Sections: ['Not Assigned'],
};

async function main() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() as any });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingTabs = new Set(meta.data.sheets?.map((s) => s.properties?.title));

  for (const tabName of Object.keys(TABS)) {
    if (!existingTabs.has(tabName)) {
      await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] } });
      console.log(`Created tab: ${tabName}`);
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: `${tabName}!A1`, valueInputOption: 'USER_ENTERED',
      requestBody: { values: [TABS[tabName]] },
    });
  }

  // Seed ParentConcerns
  const concernRows = CONCERNS.map(([code, title, signs, normal, school, home, focus]) => [code, title, signs, normal, school, home, focus]);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range: `ParentConcerns!A2`, valueInputOption: 'USER_ENTERED', requestBody: { values: concernRows },
  });

  // Seed MasterLists
  const masterRows: string[][] = [];
  for (const [listName, labels] of Object.entries(MASTER_LISTS)) labels.forEach((label, i) => masterRows.push([listName, label, String(i)]));
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range: `MasterLists!A2`, valueInputOption: 'USER_ENTERED', requestBody: { values: masterRows },
  });

  console.log('✅ Spreadsheet structure + master data ready.');
  console.log('Next: add yourself as a Teacher/Admin row in the "Teachers" tab (googleEmail must match your Google login).');
}

main().catch((e) => { console.error(e); process.exit(1); });
