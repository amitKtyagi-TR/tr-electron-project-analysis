import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  FlatList,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

function MyReactNativeApp() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('userdata');
      if (savedData) {
        setData(JSON.parse(savedData));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const handlePress = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => handlePress()}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (Platform.OS === 'ios') {
    return (
      <NavigationContainer>
        <View style={styles.container}>
          <Text style={styles.title}>iOS React Native App</Text>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        </View>
      </NavigationContainer>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: animatedValue }]}>
        <Text style={styles.title}>React Native App</Text>
      </Animated.View>
      {data.map((item) => (
        <TouchableOpacity key={item.id} onPress={handlePress}>
          <Text>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: width > 400 ? 24 : 18,
    fontWeight: 'bold',
    color: Platform.select({ ios: '#007AFF', android: '#2196F3' }),
  },
  item: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
  },
});

export default MyReactNativeApp;
