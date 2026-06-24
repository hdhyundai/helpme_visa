import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { EmployeeDBItem } from './types';

// Provided user firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxUZLBx9zRhUK-5RRsRp4UPujyOrvDsfg",
  authDomain: "hd-visa-system.firebaseapp.com",
  projectId: "hd-visa-system",
  storageBucket: "hd-visa-system.firebasestorage.app",
  messagingSenderId: "635228928760",
  appId: "1:635228928760:web:5293bd988de4bfa1c9590d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save employee to Firestore & LocalStorage
export async function saveEmployee(item: EmployeeDBItem): Promise<boolean> {
  const documentId = item.i_arc || `temp_${Date.now()}`;
  
  // 1. Always save to local storage as fallback/immediate feedback
  try {
    const dbStr = localStorage.getItem('visa_employee_db') || '[]';
    const localDb: EmployeeDBItem[] = JSON.parse(dbStr);
    const idx = localDb.findIndex(e => e.i_arc === item.i_arc);
    const updated = { ...item, lastUpdated: new Date().toISOString().split('T')[0] };
    if (idx >= 0) {
      localDb[idx] = updated;
    } else {
      localDb.push(updated);
    }
    localStorage.setItem('visa_employee_db', JSON.stringify(localDb));
  } catch (err) {
    console.error('Local storage save error:', err);
  }

  // 2. Try saving to Firestore
  try {
    const docRef = doc(db, 'employees', documentId);
    await setDoc(docRef, {
      ...item,
      updatedAt: serverTimestamp(),
      lastUpdated: new Date().toISOString().split('T')[0]
    });
    console.log(`Cloud sync success for ${item.i_surname}`);
    return true;
  } catch (err) {
    console.error('Firestore cloud save failed (Permission or Network). Local copy is safe:', err);
    return false;
  }
}

// Fetch all employees from Firestore, falling back to LocalStorage if error
export async function fetchEmployees(): Promise<{ source: 'cloud' | 'local'; items: EmployeeDBItem[] }> {
  try {
    const q = query(collection(db, 'employees'));
    const querySnapshot = await getDocs(q);
    const cloudItems: EmployeeDBItem[] = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      // Filter out Firebase timestamps from direct cast
      const { updatedAt, ...cleanItem } = data;
      cloudItems.push(cleanItem as EmployeeDBItem);
    });

    if (cloudItems.length > 0) {
      // Sync local storage with latest cloud items
      localStorage.setItem('visa_employee_db', JSON.stringify(cloudItems));
      return { source: 'cloud', items: cloudItems };
    }
  } catch (err) {
    console.warn('Firestore fetch failed (Permission or Network). Falling back to Local Storage:', err);
  }

  // Fallback to local storage
  try {
    const dbStr = localStorage.getItem('visa_employee_db') || '[]';
    return { source: 'local', items: JSON.parse(dbStr) };
  } catch (err) {
    console.error('Local storage parse error:', err);
    return { source: 'local', items: [] };
  }
}

// Delete employee from Firestore & LocalStorage
export async function deleteEmployee(arc: string): Promise<boolean> {
  // 1. Delete from local storage
  try {
    const dbStr = localStorage.getItem('visa_employee_db') || '[]';
    let localDb: EmployeeDBItem[] = JSON.parse(dbStr);
    localDb = localDb.filter(e => e.i_arc !== arc);
    localStorage.setItem('visa_employee_db', JSON.stringify(localDb));
  } catch (err) {
    console.error('Local storage delete error:', err);
  }

  // 2. Delete from Firestore
  try {
    await deleteDoc(doc(db, 'employees', arc));
    console.log(`Cloud delete success for ${arc}`);
    return true;
  } catch (err) {
    console.error('Firestore cloud delete failed (Permission or Network). Local copy updated:', err);
    return false;
  }
}
