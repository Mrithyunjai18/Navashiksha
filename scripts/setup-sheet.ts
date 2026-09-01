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
  ParentConcerns: ['code', 'title', 'ageWiseExpectations', 'schoolStrategies', 'homeTips'],
  MasterLists: ['listName', 'label', 'sortOrder'],
  AuditLog: ['id', 'userEmail', 'entityType', 'entityId', 'action', 'changes', 'createdAt'],
  ReportAcknowledgements: ['id', 'assessmentId', 'reply', 'createdAt'],
  CustomQuestions: ['id', 'label', 'type', 'options', 'points', 'sortOrder', 'isActive', 'parentQuestionId', 'triggerOption'],
  CustomAnswers: ['id', 'assessmentId', 'questionId', 'answer'],
};

const CONCERNS = [
  {
    code: 'ATTENTION_SPAN', title: 'Attention Span Difficulty',
    ageWise: {
      Playgroup: ['Attends to an activity for 1-2 minutes', 'Needs reminders to stay on task'],
      Nursery: ['Gets distracted easily, needs redirection'],
      LKG: ['Attends for 5-10 minutes', 'Can focus with minimal reminders'],
      UKG: ['Attends for 10-15 minutes', 'Completes short tasks with less support'],
    },
    schoolStrategies: ['Short, engaging activities', 'Movement breaks (hopping, stretching)', 'Freeze & Go, follow-the-action games', 'One task at a time'],
    homeTips: ['Keep activities short and interesting', 'Give one instruction at a time', 'Reduce distractions (TV, mobile)', 'Praise effort and completion'],
  },
  {
    code: 'SOCIALIZING', title: 'Socialising Difficulty',
    ageWise: {
      Playgroup: ['Plays beside others', 'Watches other children'],
      Nursery: ['Shows interest in other children', 'Plays simple games with support'],
      LKG: ['Plays with others', 'Takes turns with support', 'Shares sometimes'],
      UKG: ['Plays in a group', 'Takes turns independently', 'Shares and cooperates'],
    },
    schoolStrategies: ['Circle time & group activities', 'Partner games & turn-taking games', 'Role play & dramatisation', 'Sharing & caring activities'],
    homeTips: ['Arrange playdates', 'Encourage sharing & turn-taking', 'Teach greetings & polite words', "Don't force interaction"],
  },
  {
    code: 'READING_READINESS', title: 'Reading Difficulty / Reading Readiness',
    ageWise: {
      Playgroup: ['Enjoys picture books', 'Looks at pictures', 'Listens to stories'],
      Nursery: ['Understands simple stories', 'Identifies familiar pictures', 'Enjoys rhymes'],
      LKG: ['Recognises letters (some)', 'Identifies starting sounds', 'Attempts to read simple words'],
      UKG: ['Reads simple words and sentences', 'Understands story and answers questions'],
    },
    schoolStrategies: ['Storytelling & picture reading', 'Phonics & sound games', 'Rhyming activities', 'Letter-sound games & blending', 'Picture sequencing & comprehension', 'Shared reading & "what happens next?"'],
    homeTips: ['Read a story daily', 'Talk about pictures', 'Play rhyming games', 'Identify starting sounds', 'Encourage child to read familiar words'],
  },
  {
    code: 'SPEAKING_COMMUNICATION', title: 'Speaking & Communication Difficulty',
    ageWise: {
      Playgroup: ['Babbling & uses few words', 'Points to express needs'],
      Nursery: ['Speaks in short sentences', 'Asks simple questions', 'Names objects'],
      LKG: ['Speaks in sentences', 'Expresses ideas with support'],
      UKG: ['Speaks clearly in sentences', 'Uses new words', 'Expresses ideas confidently'],
    },
    schoolStrategies: ['Circle time conversations', 'Show & Tell, picture talk', 'Puppet talk & role play', 'Songs, rhymes & story retelling', 'Partner talk activities'],
    homeTips: ['Talk during daily routines', 'Ask open questions', 'Encourage full sentences', 'Give time to answer', 'Read aloud and discuss'],
  },
  {
    code: 'WRITING_READINESS', title: 'Writing Difficulty / Writing Readiness',
    ageWise: {
      Playgroup: ['Enjoys scribbling', 'Makes random lines'],
      Nursery: ['Draws lines & circles', 'Holds crayon with support', 'Imitates strokes'],
      LKG: ['Traces lines, curves', 'Writes some letters with support', 'Begins to write own name'],
      UKG: ['Writes letters correctly', 'Writes own name', 'Writes simple words and sentences'],
    },
    schoolStrategies: ['Sand tracing & air writing', 'Playdough, beading & threading', 'Pre-writing strokes & line tracing', 'Pencil control activities', 'Letter formation practice'],
    homeTips: ['Provide crayons & paper', 'Let child draw, colour, trace', 'Playdough & threading activities', 'Simple writing practice', 'Encourage proper pencil hold'],
  },
  {
    code: 'HYPERACTIVITY', title: 'Hyperactivity / Restlessness',
    ageWise: {
      Playgroup: ['Very active', 'Finds it hard to sit for any activity'],
      Nursery: ['Moves frequently', 'Needs help to settle'],
      LKG: ['Active but can settle for short activities', 'Needs movement breaks'],
      UKG: ['Can manage energy better', 'Follows routine with little support'],
    },
    schoolStrategies: ['Hopping, jumping & obstacle course', 'Animal walks & yoga', 'Action songs & movement breaks', 'Hands-on & heavy-work activities'],
    homeTips: ['Daily outdoor play', 'Hopping, jumping games', 'Maintain routine', 'Limit screen time', 'Praise calm behaviour'],
  },
  {
    code: 'CONFIDENCE', title: 'Lack of Confidence / Stage Fear',
    ageWise: {
      Playgroup: ['Shy with new people', 'Needs comfort from adults'],
      Nursery: ['Speaks with familiar people only', 'Needs encouragement'],
      LKG: ['Hesitant to speak in group', 'Participates with support'],
      UKG: ['Speaks in group with confidence', 'Tries new activities'],
    },
    schoolStrategies: ['Show & Tell in small groups', 'Puppet speaking & role play', 'Choice-based activities', 'Buddy support & appreciation circle'],
    homeTips: ["Encourage, don't push", 'Give simple choices', 'Celebrate small attempts', 'Let child speak in comfortable settings'],
  },
  {
    code: 'FOLLOWING_INSTRUCTIONS', title: 'Difficulty Following Instructions',
    ageWise: {
      Playgroup: ['Follows single step with support', 'Needs reminders'],
      Nursery: ['Follows 1-2 step instructions with reminders'],
      LKG: ['Follows 2 step instructions with support', 'Needs repetition at times'],
      UKG: ['Follows 2-3 step instructions independently'],
    },
    schoolStrategies: ['Simon Says & action sequences', 'One-step to two-step instructions', 'Visual instruction cards', 'Classroom helper tasks', 'Repetition with support'],
    homeTips: ['Give one instruction at a time', 'Use simple words', 'Ask child to repeat instruction', 'Be consistent'],
  },
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
  const concernRows = CONCERNS.map((c) => [
    c.code, c.title, JSON.stringify(c.ageWise), c.schoolStrategies.join('|'), c.homeTips.join('|'),
  ]);
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
