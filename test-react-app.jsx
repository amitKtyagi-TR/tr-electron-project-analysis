import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

function MyReactComponent({ title }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Component mounted');
  }, []);

  const handlePress = () => {
    setCount(prev => prev + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    // API call simulation
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <View style={styles.container}>
      <Text>{title}: {count}</Text>
      <Button onPress={handlePress} title="Increment" />
      <Button onPress={handleSubmit} title="Submit" disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyReactComponent;
