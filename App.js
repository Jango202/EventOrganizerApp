import * as React from 'react';
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import * as yup from 'yup';

// Firebase configuration
const firebaseConfig = {
  // Replace with your Firebase config
 apiKey: "AIzaSyCSeFI5oxYIu_6cexr3YflURWRtE0-HH14",
  authDomain: "organizer-app-7a5b1.firebaseapp.com",
  projectId: "organizer-app-7a5b1",
  storageBucket: "organizer-app-7a5b1.firebasestorage.app",
  messagingSenderId: "29743310011",
  appId: "1:29743310011:web:11092eb053bb82dd37759e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Stack = createNativeStackNavigator();

// Validation schemas
const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const eventSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  date: yup.string().required('Date is required'),
});

// SignIn Screen
function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      await loginSchema.validate({ email, password });
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Sign In" onPress={handleSignIn} />
      <Button title="Go to Sign Up" onPress={() => navigation.navigate('SignUp')} />
    </View>
  );
}

// SignUp Screen
function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      await loginSchema.validate({ email, password });
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Sign Up" onPress={handleSignUp} />
      <Button title="Back to Sign In" onPress={() => navigation.navigate('SignIn')} />
    </View>
  );
}

// Dashboard Screen
function DashboardScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchEvents();
    });
    return unsubscribe;
  }, []);

  const fetchEvents = async () => {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const eventsList = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEvents(eventsList);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigation.navigate('SignIn');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events Dashboard</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>{item.date}</Text>
            <View style={styles.buttonContainer}>
              {item.creatorId === user?.uid && (
                <>
                  <Button title="Edit" onPress={() => navigation.navigate('EditEvent', { event: item })} />
                  <Button title="Delete" onPress={() => {
                    Alert.alert(
                      'Confirm Delete',
                      'Are you sure you want to delete this event?',
                      [
                        { text: 'Cancel' },
                        { text: 'Delete', onPress: async () => {
                          await deleteDoc(doc(db, 'events', item.id));
                          fetchEvents();
                        }}
                      ]
                    );
                  }} />
                </>
              )}
              <Button title="Favorite" onPress={async () => {
                await addDoc(collection(db, 'favorites'), { userId: user.uid, eventId: item.id });
              }} />
            </View>
          </View>
        )}
      />
      <Button title="Create Event" onPress={() => navigation.navigate('CreateEvent')} />
      <Button title="View Favorites" onPress={() => navigation.navigate('Favorites')} />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

// Create Event Screen
function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleCreateEvent = async () => {
    try {
      await eventSchema.validate({ title, description, date });
      await addDoc(collection(db, 'events'), {
        title,
        description,
        date,
        creatorId: auth.currentUser.uid,
      });
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Event</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Create" onPress={handleCreateEvent} />
    </View>
  );
}

// Edit Event Screen
function EditEventScreen({ navigation, route }) {
  const { event } = route.params;
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState(event.date);
  const [error, setError] = useState('');

  const handleUpdateEvent = async () => {
    try {
      await eventSchema.validate({ title, description, date });
      await updateDoc(doc(db, 'events', event.id), { title, description, date });
      navigation.navigate('Dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Event</Text>
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Update" onPress={handleUpdateEvent} />
    </View>
  );
}

// Favorites Screen
function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchFavorites(currentUser);
    });
    return unsubscribe;
  }, []);

  const fetchFavorites = async (currentUser) => {
    const q = query(collection(db, 'favorites'), where('userId', '==', currentUser.uid));
    const favoritesSnapshot = await getDocs(q);
    const favoriteIds = favoritesSnapshot.docs.map(doc => doc.data().eventId);
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    const favoriteEvents = eventsSnapshot.docs
      .filter(doc => favoriteIds.includes(doc.id))
      .map(doc => ({ id: doc.id, ...doc.data() }));
    setFavorites(favoriteEvents);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorite Events</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text>{item.description}</Text>
            <Text>{item.date}</Text>
            <Button title="Remove from Favorites" onPress={() => {
              Alert.alert(
                'Confirm Remove',
                'Remove this event from favorites?',
                [
                  { text: 'Cancel' },
                  { text: 'Remove', onPress: async () => {
                    const q = query(collection(db, 'favorites'), where('userId', '==', user.uid), where('eventId', '==', item.id));
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach(async (doc) => {
                      await deleteDoc(doc.ref);
                    });
                    fetchFavorites(user);
                  }}
                ]
              );
            }} />
          </View>
        )}
      />
    </View>
  );
}

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
        <Stack.Screen name="EditEvent" component={EditEventScreen} options={{ title: 'Edit Event' }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  eventItem: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
