import { CharacterData, EnvelopeData, GamePhase } from '../types';

export const GAME_TITLE = "The Anand Medical College Murder";
export const VICTIM_NAME = "Dean Dr. Vikram Rathod";
export const VICTIM_ROLE = "Dean, Anand Medical College";
export const TIME_OF_DEATH = "11:00 PM – 11:40 PM";
export const LOCATION = "Anatomy Dissection Hall, Anand Medical College";

export const DROP_ORDER_CHARACTER_IDS = [18, 12, 8, 4, 19, 11]; // Dhruv Iyer, Kabir Deshmukh, Sunita Kale, Anil Deshmukh, Zara Ansari, Nisha Bhatia
export const PROTECTED_CHARACTER_IDS = [6, 7, 9, 10, 14, 15, 16, 20]; // Never drop

export function getActiveCharactersForCapacity(capacity: number = 20): CharacterData[] {
  const targetCap = Math.max(12, Math.min(20, capacity));
  const numToDrop = Math.max(0, 20 - targetCap);
  const droppedIds = new Set(DROP_ORDER_CHARACTER_IDS.slice(0, numToDrop));
  return CHARACTERS.filter((c) => !droppedIds.has(c.id));
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 1,
    name: "Dr. Meera Rathod",
    title: "Head of Pathology",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 10,
    intro_en: "I am Dr. Meera Rathod. Head of Pathology. And until three days ago, I was the Dean's wife.",
    intro_gu: "હું ડૉ. મીરા રાઠોડ. Pathology ની Head. અને ત્રણ દિવસ પહેલાં સુધી, Dean ની પત્ની.",
    public_bio: "You married Vikram in 1997. You have spent twenty-nine years being introduced as the Dean's wife at functions where you were the better doctor.",
    fragment_riddle: "I keep a book no library holds and I count debts no bank records. My father cuts the dead. I collect from the living.",
    code_half: "72",
    speaks_first: true,
    envelope_letter: "A",
  },
  {
    id: 2,
    name: "Dr. Sanjay Bhatia",
    title: "Head of Surgery",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 11,
    intro_en: "Dr. Sanjay Bhatia. Head of Surgery. Eleven years I have run these operating theatres. The Dean's chair should have been mine.",
    intro_gu: "ડૉ. સંજય ભાટિયા. Head of Surgery. અગિયાર વર્ષથી આ theatres હું ચલાવું છું. Dean ની ખુરશી મારી હોવી જોઈતી હતી.",
    public_bio: "You have run this hospital's operating theatres for eleven years while Vikram ran his mouth in press conferences. The Dean's chair was supposed to be yours.",
    fragment_riddle: "Three weeks old in this building and already the most important person in it. I opened a door and found the end of everything.",
    code_half: "51",
    speaks_first: false,
    envelope_letter: "B",
  },
  {
    id: 3,
    name: "Dr. Farida Qureshi",
    title: "Head of Anaesthesia",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 13,
    intro_en: "Dr. Farida Qureshi. Anaesthesia. I put this whole college to sleep and I wake them up again. Every single one of them, so far.",
    intro_gu: "ડૉ. ફરીદા કુરેશી. Anaesthesia. આખી college ને હું સુવડાવું છું અને પાછી જગાડું છું. અત્યાર સુધી તો બધાને.",
    public_bio: "Thirty years of putting people to sleep and waking them up again. Not one of them ever failed to wake up. Until eight months ago.",
    fragment_riddle: "I have sat the same year three times. My surname opens doors my marksheet never could. I know what a seat costs, to the rupee.",
    code_half: "38",
    speaks_first: false,
    envelope_letter: "C",
  },
  {
    id: 4,
    name: "Mr. Anil Deshmukh",
    title: "Trustee, not a doctor",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 12,
    extension: "201",
    intro_en: "Anil Deshmukh. Trustee. I am not a doctor. I own three floors of this hospital and I sign the cheques.",
    intro_gu: "અનિલ દેશમુખ. Trustee. હું doctor નથી. આ hospital ના ત્રણ માળ મારા છે અને cheque પર સહી હું કરું છું.",
    public_bio: "You do not treat patients. You sign cheques and you own three floors of this hospital.",
    fragment_riddle: "My name is always third on the paper and never first anywhere else. I knew his handwriting better than his wife did.",
    code_half: "94",
    speaks_first: false,
    envelope_letter: "D",
  },
  {
    id: 5,
    name: "Dr. Rekha Iyer",
    title: "Head of Admissions",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 18,
    extension: "203",
    intro_en: "Dr. Rekha Iyer. Head of Admissions. Every seat in this college passes across my desk. Every parent in this room has called me first.",
    intro_gu: "ડૉ. રેખા ઐયર. Head of Admissions. આ college ની દરેક seat મારા table પરથી પસાર થાય છે. અહીં બેઠેલા દરેક વાલીએ પહેલો ફોન મને કર્યો છે.",
    public_bio: "Every seat in this college passes across your desk. Every parent in this room has, at some point, called you first.",
    fragment_riddle: "I am the first in my blood to wear this coat. Two days ago a great man asked me a small question and I have not slept since.",
    code_half: "66",
    speaks_first: false,
    envelope_letter: "E",
  },
  {
    id: 6,
    name: "Dr. Prakash Nair",
    title: "Head of Forensic Medicine",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 14,
    intro_en: "Dr. Prakash Nair. Forensic Medicine. I have opened four thousand bodies. This is the first one whose name I knew before I started.",
    intro_gu: "ડૉ. પ્રકાશ નાયર. Forensics. મેં ચાર હજાર body ખોલી છે. આ પહેલી છે જેનું નામ મને પહેલેથી ખબર હતું.",
    public_bio: "You have opened four thousand bodies. This is the first one whose name you knew before you started.",
    fragment_riddle: "Four years at the top and not one person believes it is mine. My father holds a knife. I hold a rank.",
    code_half: "20",
    speaks_first: true,
    envelope_letter: "F",
    has_second_attack: true,
    special_notes: "SEALED NOTE, DO NOT OPEN UNTIL THE HOST TELLS YOU TO.",
  },
  {
    id: 7,
    name: "Mr. Ramesh Gokhale",
    title: "Registrar, not a doctor",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 16,
    extension: "204",
    intro_en: "Ramesh Gokhale. Registrar. Thirty-one years in this building. Every one of them calls each other Doctor, and me just Gokhale.",
    intro_gu: "રમેશ ગોખલે. Registrar. એકત્રીસ વર્ષથી આ building માં છું. બધા એકબીજાને Doctor કહે છે, અને મને ખાલી ગોખલે.",
    public_bio: "Thirty-one years in this building and every one of these people still calls you \"Gokhale\" while calling each other \"Doctor.\" You hold the master key to every room in the college. Nobody has ever thought that was worth noticing.",
    fragment_riddle: "I am the only honest one in my family and it has cost me every one of them. I wear gold at convocation and silence everywhere else.",
    code_half: "13",
    speaks_first: false,
    envelope_letter: "G",
    special_notes: "Warning: the envelope your pair unlocks is the worst one in the building for you. Get to it first.",
  },
  {
    id: 8,
    name: "Dr. Sunita Kale",
    title: "Head of Psychiatry",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 15,
    intro_en: "Dr. Sunita Kale. Psychiatry. I know what every person in this room is afraid of. Professionally.",
    intro_gu: "ડૉ. સુનીતા કાળે. Psychiatry. આ room માં બેઠેલા દરેકનો ડર મને ખબર છે. Professionally.",
    public_bio: "You know what every person in this room is afraid of. Professionally.",
    fragment_riddle: "Everyone assumes I am here because I am brilliant. He and I both knew otherwise. Tonight I am the most sympathetic person in the room.",
    code_half: "45",
    speaks_first: true,
    envelope_letter: "H",
  },
  {
    id: 9,
    name: "Dr. Iqbal Sheikh",
    title: "Head of Pharmacology",
    generation: "senior",
    batch: "Class of 1994",
    parent_of: 17,
    intro_en: "Dr. Iqbal Sheikh. Pharmacology. Every drug in this building is written in my register, in my own handwriting.",
    intro_gu: "ડૉ. ઇકબાલ શેખ. Pharmacology. આ building ની દરેક દવા મારા register માં, મારા પોતાના હાથે લખાયેલી છે.",
    public_bio: "Every drug in this building is logged in your register, in your handwriting.",
    fragment_riddle: "I am my mother in every way I resent. I put people to sleep for a living and I have not slept properly since spring.",
    code_half: "81",
    speaks_first: true,
    envelope_letter: "I",
  },
  {
    id: 10,
    name: "Aarav Rathod",
    title: "Final year, Son of Dean & Dr. Meera",
    generation: "junior",
    batch: "Final year",
    child_of: 1,
    intro_en: "Aarav Rathod. Final year. Yes, he was my father. No, that is not why I am here.",
    intro_gu: "આરવ રાઠોડ. Final year. હા, એ મારા પપ્પા હતા. ના, એટલા માટે હું અહીં નથી.",
    public_bio: "Everyone assumes you are here because you are brilliant. You are here because you are his son, and you both knew it.",
    fragment_riddle: "I know what each of you is afraid of, and I charge for it by the hour.",
    code_half: "29",
    speaks_first: false,
    envelope_letter: "H",
  },
  {
    id: 11,
    name: "Nisha Bhatia",
    title: "Final year topper, Daughter of Dr. Sanjay",
    generation: "junior",
    batch: "Final year",
    child_of: 2,
    intro_en: "Nisha Bhatia. Final year. Topper, four years running. My father is Head of Surgery, so nobody believes the rank is mine.",
    intro_gu: "નિશા ભાટિયા. Final year. ચાર વર્ષથી topper. મારા પપ્પા Head of Surgery છે, એટલે કોઈ માનતું નથી કે rank મારી છે.",
    public_bio: "Your father is Head of Surgery. Nobody believes your rank is yours. It is.",
    fragment_riddle: "I have opened four thousand bodies. This is the first whose name I knew before I began.",
    code_half: "17",
    speaks_first: false,
    envelope_letter: "F",
  },
  {
    id: 12,
    name: "Kabir Deshmukh",
    title: "Third year, Son of Mr. Anil Deshmukh",
    generation: "junior",
    batch: "Third year",
    child_of: 4,
    intro_en: "Kabir Deshmukh. Third year. Third time in third year. My father is on the trust board, so make of that what you like.",
    intro_gu: "કબીર દેશમુખ. Third year. ત્રીજી વાર third year માં. મારા પપ્પા trust board માં છે, હવે તમે સમજી લો.",
    public_bio: "You are not a good student and you have made peace with it. Your father has not.",
    fragment_riddle: "I take away pain and I give back consciousness. Tonight I have lost something I signed for.",
    code_half: "42",
    speaks_first: true,
    envelope_letter: "C",
  },
  {
    id: 13,
    name: "Tanya Qureshi",
    title: "Intern anaesthesia, Daughter of Dr. Farida",
    generation: "junior",
    batch: "Intern",
    child_of: 3,
    intro_en: "Tanya Qureshi. Intern, anaesthesia. My mother runs the department. I have already heard every joke about it.",
    intro_gu: "તાન્યા કુરેશી. Intern, anaesthesia. મારા મમ્મી એ જ department ના Head છે. એના પરના બધા જોક્સ મેં સાંભળી લીધા છે.",
    public_bio: "You are your mother's daughter in every way including the ones you resent.",
    fragment_riddle: "Every drug in this building is written in my hand. Next Monday, someone was going to check.",
    code_half: "06",
    speaks_first: false,
    envelope_letter: "I",
  },
  {
    id: 14,
    name: "Rohan Nair",
    title: "Final year hostel secretary, Son of Dr. Prakash",
    generation: "junior",
    batch: "Final year",
    child_of: 6,
    intro_en: "Rohan Nair. Final year. Hostel secretary. Officially I run the mess committee. Unofficially I run everything else.",
    intro_gu: "રોહન નાયર. Final year. Hostel secretary. Officially હું mess committee ચલાવું છું. Unofficially બાકીનું બધું.",
    public_bio: "You run the hostel. Officially the mess committee. Unofficially, everything else.",
    fragment_riddle: "I read the tissue after the story ends. For twenty-nine years I was introduced by another man's title. Tonight that title is vacant.",
    code_half: "83",
    speaks_first: false,
    envelope_letter: "A",
  },
  {
    id: 15,
    name: "Simran Kale",
    title: "Final year gold medallist, Daughter of Dr. Sunita",
    generation: "junior",
    batch: "Final year",
    child_of: 8,
    intro_en: "Simran Kale. Final year. Gold medallist. I am the only honest person in my family and it has cost me all of them.",
    intro_gu: "સિમરન કાળે. Final year. Gold medallist. મારા ઘરમાં હું એકલી જ સાચી છું, અને એની કિંમત મેં ચૂકવી છે.",
    public_bio: "You are the only genuinely honest person in your family and it has cost you every relationship in it.",
    fragment_riddle: "Thirty-one years in this building and every doctor still calls me by my surname alone. I open every door here and nobody has ever wondered why.",
    code_half: "50",
    speaks_first: true,
    envelope_letter: "G",
  },
  {
    id: 16,
    name: "Vivek Gokhale",
    title: "Second year, Son of Mr. Ramesh Gokhale",
    generation: "junior",
    batch: "Second year",
    child_of: 7,
    intro_en: "Vivek Gokhale. Second year. First person in my family to wear this coat. My father is the Registrar, and people whisper about that.",
    intro_gu: "વિવેક ગોખલે. Second year. મારા ઘરમાં આ coat પહેરનારો પહેલો. મારા પપ્પા Registrar છે, અને લોકો એના વિશે ગુસપુસ કરે છે.",
    public_bio: "Your father is the Registrar. You have spent two years hearing \"management quota\" whispered behind you by people whose fathers actually did buy their seats.",
    fragment_riddle: "Every seat in this college passes across my desk, and so does every parent's first phone call.",
    code_half: "92",
    speaks_first: true,
    envelope_letter: "E",
  },
  {
    id: 17,
    name: "Ayesha Sheikh",
    title: "Intern, Students Union president, Daughter of Dr. Iqbal",
    generation: "junior",
    batch: "Intern",
    child_of: 9,
    intro_en: "Ayesha Sheikh. Intern. President of the Students Union. I run the protests, the festival, and all the paperwork none of you will touch.",
    intro_gu: "આયેશા શેખ. Intern. Students Union ની President. Protest, festival, અને જે paperwork કોઈ અડતું નથી, એ બધું હું કરું છું.",
    public_bio: "You organise the protests, the fest, and the paperwork nobody else will touch.",
    fragment_riddle: "I am the only one here who chose to leave. You call it failure. I call it a term sheet.",
    code_half: "33",
    speaks_first: true,
    envelope_letter: "J",
  },
  {
    id: 18,
    name: "Dhruv Iyer",
    title: "Startup founder, Dropped out in second year, Son of Dr. Rekha",
    generation: "junior",
    batch: "Not a student",
    child_of: 5,
    intro_en: "Dhruv Iyer. I dropped out of this college in second year. I now run a health-tech startup. You all call that failure. I call it a term sheet.",
    intro_gu: "ધ્રુવ ઐયર. Second year માં આ college છોડી દીધી. હવે health-tech startup ચલાવું છું. તમે એને failure કહો છો. હું એને term sheet કહું છું.",
    public_bio: "You are the only person in this room who chose to leave. Everyone treats it as a failure. You have a term sheet in your inbox.",
    fragment_riddle: "I run the protests, the fest, and the paperwork none of you will touch. I take the back route to work and I notice bins.",
    code_half: "79",
    speaks_first: false,
    envelope_letter: "J",
  },
  {
    id: 19,
    name: "Zara Ansari",
    title: "Final year, the Dean's research assistant (No family here)",
    generation: "junior",
    batch: "Final year",
    child_of: null,
    intro_en: "Zara Ansari. Final year. I was the Dean's research assistant for two years. My name was always third on the paper.",
    intro_gu: "ઝારા અન્સારી. Final year. બે વર્ષ Dean ની research assistant હતી. Paper પર મારું નામ હંમેશા ત્રીજું.",
    public_bio: "Two years co-authoring his papers. Your name always third.",
    fragment_riddle: "I have never held a scalpel and I own three floors. Ask me about the building. Do not ask me about the seats.",
    code_half: "58",
    speaks_first: true,
    envelope_letter: "D",
  },
  {
    id: 20,
    name: "Priya Menon",
    title: "First year, found the body (No family here)",
    generation: "junior",
    batch: "First year",
    child_of: null,
    intro_en: "Priya Menon. First year. I joined three weeks ago, I know none of you, and I am the one who found the body.",
    intro_gu: "પ્રિયા મેનન. First year. ત્રણ અઠવાડિયા પહેલાં જ આવી છું, કોઈને ઓળખતી નથી, અને body મને મળી.",
    public_bio: "You are the newest person in this building and the only one with nothing to hide, which is precisely why nobody trusts you.",
    fragment_riddle: "I cut for a living and I was cut out of a promotion. At nine o'clock I raised my voice. At nine-thirty, I say, I left.",
    code_half: "64",
    speaks_first: true,
    envelope_letter: "B",
    has_compel_token: true,
  },
];

export const ENVELOPES: Record<string, EnvelopeData> = {
  A: {
    letter: "A",
    members: [1, 14],
    code: "7283",
    title: "MASTER KEY REGISTER",
    summary: "Four master keys ever issued. Key 2 held by Registrar R. Gokhale since 1995 with no loss report on file.",
    char_id_1: 1, // Meera Rathod (72)
    char_id_2: 14, // Rohan Nair (83)
  },
  B: {
    letter: "B",
    members: [20, 2],
    code: "6451",
    title: "TELECOM, DEAN'S OFFICE LANDLINE",
    summary: "Incoming call at 21:44:12 lasting 3m 51s originated from internal Extension 204 (Registrar's Office).",
    char_id_1: 20, // Priya Menon (64)
    char_id_2: 2, // Sanjay Bhatia (51)
  },
  C: {
    letter: "C",
    members: [12, 3],
    code: "4238",
    title: "OT-3 NIGHT ORDERLY CHECKLIST, 18:40",
    summary: "Potassium chloride vial missing from trolley after cancelled cardiac case between 6:15 PM and 6:40 PM.",
    char_id_1: 12, // Kabir Deshmukh (42)
    char_id_2: 3, // Farida Qureshi (38)
  },
  D: {
    letter: "D",
    members: [19, 4],
    code: "5894",
    title: "SHREDDER RECONSTRUCTION",
    summary: "Taped bank statements showing ₹9 crore transferred over 5 years to joint account of A. Deshmukh and R. Iyer.",
    char_id_1: 19, // Zara Ansari (58)
    char_id_2: 4, // Anil Deshmukh (94)
  },
  E: {
    letter: "E",
    members: [16, 5],
    code: "9266",
    title: "REGISTRAR'S OFFICE: FILE MOVEMENT INDEX",
    summary: "Vivek Ramesh Gokhale's real state board aggregate was 61.4%, forged on admission record to 91.2%.",
    char_id_1: 16, // Vivek Gokhale (92)
    char_id_2: 5, // Rekha Iyer (66)
  },
  F: {
    letter: "F",
    members: [6, 11],
    code: "2017",
    title: "SUPPLEMENTARY AUTOPSY NOTE",
    summary: "Clean injection mark with no struggle. Formalin residue on collar shows the killer waited in the dark hall.",
    char_id_1: 6, // Prakash Nair (20)
    char_id_2: 11, // Nisha Bhatia (17)
  },
  G: {
    letter: "G",
    members: [15, 7],
    code: "5013",
    title: "THE ANONYMOUS LETTER",
    summary: "Dean's handwriting: 'Verify from admissions first... Cross-check Gokhale's boy before anything else.'",
    char_id_1: 15, // Simran Kale (50)
    char_id_2: 7, // Ramesh Gokhale (13)
  },
  H: {
    letter: "H",
    members: [8, 10],
    code: "4529",
    title: "DRAFT WILL, UNSIGNED",
    summary: "Advocate draft removing Aarav Vikram Rathod entirely from estate. Unsigned, so estate passes to Meera.",
    char_id_1: 8, // Sunita Kale (45)
    char_id_2: 10, // Aarav Rathod (29)
  },
  I: {
    letter: "I",
    members: [9, 13],
    code: "8106",
    title: "PHARMACY CORRIDOR CCTV, 18:38",
    summary: "A tall man in a grey safari suit entering corridor outside OT-3. No medical staff wears a safari suit.",
    char_id_1: 9, // Iqbal Sheikh (81)
    char_id_2: 13, // Tanya Qureshi (06)
  },
  J: {
    letter: "J",
    members: [17, 18],
    code: "3379",
    title: "FOOTWEAR RECOVERED, BIN BEHIND ANATOMY HALL",
    summary: "Size 11 leather Oxfords with formalin residue. Contains medical-grade orthotic insole for chronic knee offloading.",
    char_id_1: 17, // Ayesha Sheikh (33)
    char_id_2: 18, // Dhruv Iyer (79)
  }
};

export const FAMILY_TREE = [
  { parentId: 1, parentName: "Dr. Meera Rathod", parentDept: "Pathology", childId: 10, childName: "Aarav Rathod", childRole: "Final year (Dean's Son)" },
  { parentId: 2, parentName: "Dr. Sanjay Bhatia", parentDept: "Surgery", childId: 11, childName: "Nisha Bhatia", childRole: "Final year, topper" },
  { parentId: 3, parentName: "Dr. Farida Qureshi", parentDept: "Anaesthesia", childId: 13, childName: "Tanya Qureshi", childRole: "Intern, anaesthesia" },
  { parentId: 4, parentName: "Mr. Anil Deshmukh", parentDept: "Trustee (Non-Doctor)", childId: 12, childName: "Kabir Deshmukh", childRole: "Third year (Failed twice)" },
  { parentId: 5, parentName: "Dr. Rekha Iyer", parentDept: "Admissions", childId: 18, childName: "Dhruv Iyer", childRole: "Startup founder (MBBS Dropout)" },
  { parentId: 6, parentName: "Dr. Prakash Nair", parentDept: "Forensic Medicine", childId: 14, childName: "Rohan Nair", childRole: "Final year, hostel secretary" },
  { parentId: 7, parentName: "Mr. Ramesh Gokhale", parentDept: "Registrar (Non-Doctor)", childId: 16, childName: "Vivek Gokhale", childRole: "Second year" },
  { parentId: 8, parentName: "Dr. Sunita Kale", parentDept: "Psychiatry", childId: 15, childName: "Simran Kale", childRole: "Final year, gold medallist" },
  { parentId: 9, parentName: "Dr. Iqbal Sheikh", parentDept: "Pharmacology", childId: 17, childName: "Ayesha Sheikh", childRole: "Intern, union president" },
];

export const OUTSIDERS = [
  { id: 19, name: "Zara Ansari", role: "Final year, Dean's research assistant", note: "No family in this room" },
  { id: 20, name: "Priya Menon", role: "First year (Admitted 3 weeks ago)", note: "Found the body • No family in this room" },
];

export const NON_DOCTORS = [
  { id: 4, name: "Mr. Anil Deshmukh", role: "Trustee", note: "Owns 3 floors of hospital, signs cheques" },
  { id: 7, name: "Mr. Ramesh Gokhale", role: "Registrar", note: "31 years in building, holds Master Key 2" },
];

export const ADMINISTRATIVE_WING_EXTENSIONS = [
  { ext: "201", office: "Trustee", occupant: "Mr. Anil Deshmukh", personId: 4 },
  { ext: "203", office: "Admissions", occupant: "Dr. Rekha Iyer", personId: 5 },
  { ext: "204", office: "Registrar", occupant: "Mr. Ramesh Gokhale", personId: 7 },
  { ext: "207", office: "Establishment", occupant: "Disconnected since March", personId: null },
];

export const STUDENT_BATCHES = [
  { batch: "Final Year", members: ["Aarav Rathod", "Nisha Bhatia", "Rohan Nair", "Simran Kale", "Zara Ansari"] },
  { batch: "Interns", members: ["Tanya Qureshi", "Ayesha Sheikh"] },
  { batch: "Third Year", members: ["Kabir Deshmukh"] },
  { batch: "Second Year", members: ["Vivek Gokhale"] },
  { batch: "First Year", members: ["Priya Menon"] },
  { batch: "Outsider / Non-Student", members: ["Dhruv Iyer (Dropped out in 2nd year)"] },
];

export const POSITIONS_OF_ACCESS = [
  { person: "Dr. Farida Qureshi (#3)", controls: "The drug cabinet. Signs drugs out." },
  { person: "Dr. Iqbal Sheikh (#9)", controls: "The dispensary and the drug register." },
  { person: "Dr. Prakash Nair (#6)", controls: "The autopsy and the mortuary." },
  { person: "Dr. Rekha Iyer (#5)", controls: "Every admission file. Every seat." },
  { person: "Mr. Ramesh Gokhale (#7)", controls: "Master keys to every room in the college." },
  { person: "Rohan Nair (#14)", controls: "The hostel. Officially the mess committee." },
  { person: "Ayesha Sheikh (#17)", controls: "The Students Union and its paperwork." },
  { person: "Zara Ansari (#19)", controls: "The Dean's desk, diary, and research files." },
];

export const KNOWN_FRICTION = [
  { title: "Dr. Bhatia & the Dean", detail: "Bhatia wanted the Dean's chair for a decade. Shouting argument at 9 PM heard by 3 people." },
  { title: "Nisha Bhatia's Rank", detail: "4 years topper, but college whispers it is because her father is Head of Surgery." },
  { title: "Kabir Deshmukh's Seat", detail: "Failed 3rd year twice; father sits on trust board." },
  { title: "Vivek Gokhale's Admission", detail: "2 years of 'management quota' whispered behind him." },
  { title: "Dhruv Iyer Left", detail: "Only person who walked out of medicine to do a health startup; half the room calls it failure." },
  { title: "Tanya Qureshi's Posting", detail: "Interns in the exact department her mother runs." },
  { title: "Ayesha Sheikh & Administration", detail: "Union president fought admin on fees and exams 3 times this year." },
  { title: "Aarav Rathod's Results", detail: "The Dean's son has not passed final year." },
];

export const PHASE_CONFIG: Record<GamePhase, { title: string; subtitle: string; defaultDurationSeconds: number; showClueCard?: boolean }> = {
  LOBBY: {
    title: "Assembly in the Dean's Chamber",
    subtitle: "Roster assembly, character dossier verification, and room readiness.",
    defaultDurationSeconds: 0
  },
  READ_IN: {
    title: "Read-In: Private Case Dossiers",
    subtitle: "Study your identity, confidential secrets, known facts, and fragment riddles in silence.",
    defaultDurationSeconds: 600 // 10 min
  },
  R1_WAKE: {
    title: "Round 1: The Wake & Initial Declarations",
    subtitle: "Public announcements, sharing verified known facts, and scoping early alibis.",
    defaultDurationSeconds: 900, // 15 min
    showClueCard: true
  },
  R2_PAIRING: {
    title: "Round 2: The Cryptic Fragment Pairs",
    subtitle: "Cross the room to locate your matching riddle partner and align your 4-digit envelope code.",
    defaultDurationSeconds: 1200 // 20 min
  },
  R3_BOARD: {
    title: "Round 3: The Public Evidence Board",
    subtitle: "Decide whether to publish evidence to the live board or hold it in sealed custody.",
    defaultDurationSeconds: 1500, // 25 min
    showClueCard: true
  },
  INTERVAL: {
    title: "The Interval: A Shock in the Night",
    subtitle: "Tensions culminate as a second attack strikes within the college grounds.",
    defaultDurationSeconds: 1200, // 20 min
    showClueCard: true
  },
  R4_INTERROGATION: {
    title: "Round 4: Sworn Interrogation & Compels",
    subtitle: "Confront suspects directly. Priya Menon exercises her compulsory truth token.",
    defaultDurationSeconds: 1200, // 20 min
    showClueCard: true
  },
  R5_HUNT: {
    title: "Round 5: Forensic Scavenge & Final Inquiries",
    subtitle: "Corroborate the missing OT-3 vial and the Registrar's carbon copy dossiers.",
    defaultDurationSeconds: 1200 // 20 min
  },
  DEDUCTION: {
    title: "The Final Deduction Sheet",
    subtitle: "Submit your confidential case theories: the killer, weapon source, motive, and hidden secrets.",
    defaultDurationSeconds: 600 // 10 min
  },
  VOTE: {
    title: "The Formal Indictment Ballot",
    subtitle: "Cast your single binding vote for the person who murdered Dean Vikram Rathod.",
    defaultDurationSeconds: 600 // 10 min
  },
  REVEAL: {
    title: "The Forensic Resolution & Verdict",
    subtitle: "Tally the votes, unmask the murderer, score deduction sheets, and review complicit records.",
    defaultDurationSeconds: 0
  }
};

export const PLAYER_MANUAL = {
  title_en: "How to Play",
  title_gu: "રમત કેવી રીતે રમવી",
  story_en: `Anand Medical College, Mumbai. Results night. At 11:40 PM a first-year student walks into the Anatomy Hall and finds the Dean dead on a dissection table. Poisoned by injection. The door was locked from the outside.

Twenty people were in that building. Nine were his batchmates from the class of 1994. Eleven are their children. Every one of them had a reason to want him gone.

One of you killed him. At the end of the night, everyone votes.`,
  story_gu: `Anand Medical College ના Dean રાત્રે 11:40 વાગ્યે Anatomy Hall માં મરેલા મળ્યા. ઝેરનું injection. બારણું બહારથી બંધ. એ રાત્રે તમે વીસ જણ એ building માં હતા. તમારામાંથી એક જણે એમને માર્યા છે.`,
  card_three_things: [
    {
      num: 1,
      title_en: "Who you are",
      title_gu: "તમે કોણ છો",
      desc_en: "Your name and role. There is an introduction line written on your card. In Round 1 you read it out loud. That is all. Nothing to invent.",
      desc_gu: "Round 1 માં તમારા card પરની લાઈન મોટેથી વાંચવાની છે."
    },
    {
      num: 2,
      title_en: "Your secret",
      title_gu: "તમારું છુપાવેલું",
      desc_en: "You are hiding something. It is almost never murder, but it looks terrible.",
      desc_gu: "તમે કંઈક છુપાવો છો. એ ખૂન નથી, પણ શંકાસ્પદ લાગે છે."
    },
    {
      num: 3,
      title_en: "What you saw",
      title_gu: "તમે શું જોયું",
      desc_en: "One fact from that night. This is verified truth.",
      desc_gu: "એ રાતની એક સાચી ઘટના."
    }
  ],
  rules: [
    {
      ruleNum: 1,
      name_en: "Rule 1: Lie about your secret",
      name_gu: "નિયમ 1: તમારા secret પર ખુલ્લેઆમ જૂઠું બોલો",
      body_en: "Freely. Deny it, deflect, invent an alibi. That is the game.",
      body_gu: "તમારા secret પર ખુલ્લેઆમ જૂઠું બોલો, બહાના બનાવો."
    },
    {
      ruleNum: 2,
      name_en: "Rule 2: Never lie about what you saw",
      name_gu: "નિયમ 2: તમે જે જોયું એના પર ક્યારેય જૂઠું નહીં",
      body_en: "If someone asks you directly, you must tell the truth. You may stall, refuse for a while, or trade it for something. You may NOT invent a different version.",
      body_gu: "તમે જે જોયું એના પર ક્યારેય જૂઠું નહીં. ટાળી શકો, બદલામાં કંઈક માંગી શકો, પણ ખોટી વાત બનાવી ના શકો."
    }
  ],
  golden_motto_en: "Lie about yourself. Tell the truth about what you saw.",
  golden_motto_gu: "પોતાના વિશે જૂઠું. જોયેલી વાત પર સાચું.",
  finding_partner_steps: [
    "Work out who the riddle describes on your card.",
    "Go to them and say your riddle. One person at a time (do NOT shout across the room!).",
    "Join your two code halves in the order specified on your screen.",
    "Submit the combined 4-digit code to unseal your evidence exhibit."
  ],
  publish_vs_seal: {
    publish_en: "PUBLISH (બતાવો): Read it aloud to the room. It goes on the live public evidence board. It cannot be undone.",
    seal_en: "SEAL (છુપાવો): Keep it private. The board will show SEALED and both your names. Everyone will know you are hiding something!",
    danger_en: "Publishing needs ONLY ONE of you. Your partner can betray you at any moment. Deals made aloud in front of the Host are binding!"
  },
  evidence_waves: [
    { wave: "Tier I (White)", round: "Round 2", sealable: "Yes (Publish or Seal)" },
    { wave: "Tier II (Yellow)", round: "Round 4", sealable: "Yes (Publish or Seal)" },
    { wave: "Tier III (Red)", round: "Round 5", sealable: "No (Host reads all 10 aloud!)" }
  ],
  five_short_rules: [
    "1. Lie about yourself. Tell the truth about what you saw.",
    "2. Deals made aloud in front of the Host are binding.",
    "3. Do not shout your riddle across the room (you will lose your vote).",
    "4. Never read anyone else's card or phone screen.",
    "5. If you are the killer, you may lie about EVERYTHING."
  ]
};
