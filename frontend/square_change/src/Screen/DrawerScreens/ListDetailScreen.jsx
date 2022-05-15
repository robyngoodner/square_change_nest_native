import React,{useState, useEffect, createRef, useCallback} from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Linking, TouchableOpacity, Button, SafeAreaView, Alert, TextInput, ScrollView,Keyboard, KeyboardAvoidingView, Platform } from 'react-native';

import BouncyCheckbox from "react-native-bouncy-checkbox";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { navigation, useIsFocused } from '@react-navigation/native';
import SendSMS from 'react-native-sms';

import * as itemService from '../../api/item.service';
import * as listService from '../../api/list.service';
import * as authservice from '../../api/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../Components/Loader';

 

export default function ListDetailScreen ({ navigation, route }) {
    const [userId, setUserId] = useState();
    const [loading, setLoading] = useState(false);
    const [errortext, setErrortext] = useState('');
    const { title, id, description } = route.params
    const [body, setBody] = useState('');
    const [items, setItems ] = useState([]);
    const [isChecked, setIsChecked] = useState(false)
    const [completion, setCompletion] = useState(false)
    const [list, setList] = useState({})
    const [SMSArray, setSMSArray] = useState([])
    const [SMSBody, setSMSBody] = useState('')
    const [showEditList, setShowEditList] = useState(false)
    
    const isFocused = useIsFocused()

    //console.log("list detail screen line 31 id: ",id)


  async function getUserProfile() {
    const user = await AsyncStorage.getItem('user')
    .then(user => authservice.getProfile(user)) 
    .then(res => {
      //console.log("getUserProfile2 res ",res.data)
      setUserId(res.data.id)
    })
  }


  
  const itemBodyRef = createRef();
  async function addNewItem() {
    setErrortext('');
    
    if(!body) {
      alert('Please enter a list item');return;
    }
    setLoading(true);
    let item = {
      listId: id,
      body: body,
      complete: false
    }
    //console.log(item)
    itemService.createItem(item)
    .then(res => {
      setLoading(false);
      //console.log('res.data from addNewItem: ', res.data)
      getList();
      setLoading(false)
    })
    .then(() => setLoading(false))
  }

  const clearBody = () => {
    setBody('')
  }

  async function getList() {
    //console.log("is getList running")
    setErrortext('');
    setLoading(true);
    listService.getList(id)
    .then(res => {
      setLoading(false)
      // console.log("get single list res.data: ", res.data)
      setList(res.data)
      //console.log(list[0].title)
      //console.log("this list's id? ",id)
    })
    .then(() => setLoading(false))
  }

  async function delList() {
    setErrortext('');
    setLoading(true);
    listService.deleteList(id)
    .then(res => {
      setLoading(false)
          navigation.navigate('HomeScreenStack')}
    )
    .then(() => setLoading(false))
  }

  const deleteAlert = () => {
    Alert.alert('Delete List', 'Are you sure you want to delete this list?', [
      {text: 'Cancel', onPress: () => console.log('Canceled'),
      style: 'cancel', 
      },
      {text: 'Delete', onPress: () => {
        delList()
       }}
    ])
    
}

  async function getItems () {
    //console.log("getItems??")
    setErrortext('');
    setLoading(true);
    itemService.getItems(id)
    .then(res => {
      setLoading(false)
      //console.log("get items res.data: ", res.data)
      setItems(res.data)
    })
    .then(() => setLoading(false))
  }

  async function updateItemCompletion (oldItem) {
    setErrortext('');
    //setLoading(true);
    if (oldItem.complete === false) setCompletion(true)
    else if (oldItem.complete === true) setCompletion(false);
    const item = {
      id: oldItem.id,
      body: oldItem.body,
      complete: completion
    }
    //console.log('update item object: ',item)
    itemService.updateItem(item.id, item)
    .then(res => {
      setLoading(false)
      //console.log(res.data)
    })
  }

  const listItems = () => {
    //console.log("getting to listItems")
    if (list[0]) {
    return list[0].items.map((element, key) => {
      //console.log("list item",element)
      return (
        <View style={styles.listItems} key={key}>
          <TouchableOpacity
            onPress = {() =>navigation.navigate('EditItemScreenStack', {screen: 'Edit Item Screen', params: element})}>
            <Text key={key}>
              {element.body}
            </Text>
          </TouchableOpacity>
          <BouncyCheckbox 
            isChecked = {element.complete}
            onPress={(isChecked) => {updateItemCompletion(element)}}
            fillColor="#3a84be" 
            size={20}
            />
        </View>
      )
    })
  } else {
    return (
      <View style={styles.listItems}>
        <Text>This list is empty! Add some to-do items.</Text>
      </View>
    )}
  }

  const sendSMS = () => {
    items.map((element) => {
      if(element.complete === false) {
        SMSArray.push(element.body)
      }
    })
    setSMSBody(SMSArray.join(", "))

    //.log(SMSBody)

    const operator = Platform.select({ios: '&', android: '?'});
    Linking.openURL(`sms:${operator}body=${SMSBody}`);
    setSMSArray([])
  }

  

  
  useEffect (() => {
    getUserProfile();
    getList();
    getItems();
  }, [isFocused]);
  
  
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#DDE0DD',}}>
    <ScrollView>
      <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            resetScrollToCoords={{ x: 0, y: 0 }}
            scrollEnabled={true}
            contentContainerStyle={{
              flex: 1,
              justifyContent: 'center',
              alignContent: 'center',
            }}>
        <Image
          source={require('../../assets/imgs/Bottom_todo.jpg')} 
            style={{width: 400, height: 100}}
        />
        <View style={styles.home}>
          <Loader loading={loading} />
          <View style={styles.SectionStyle}>
            <View style={styles.listHeader}>
              <View style={styles.firstRow}>
                <Text style={styles.title}>{list[0]? list[0].title : null}</Text>
                <Button
                  title="Edit list"
                  color='#1c5d8e'
                  onPress={() => { 
                      navigation.navigate('EditListDetailScreenStack', {screen: 'Edit List Detail Screen', params: list[0]})}}
                />
              </View>
              <View style={styles.secondRow}>
                <Text style={styles.description}>{list[0]? list[0].description : null}</Text>
                <Button
                  title="Delete list"
                  color='#1c5d8e'
                  onPress={deleteAlert} />
            </View>
            </View>
            {listItems()}
          </View>
              <View style={styles.InputStyle}>
                <TextInput
                  style={styles.textInputStyle}
                  onChangeText={(body) =>
                    setBody(body)
                  }
                  placeholder="Add a list item" //12345
                  placeholderTextColor="#3a84be"
                  keyboardType="default"
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit={false}
                  underlineColorAndroid="#f000"
                  returnKeyType="next"
                  ref={itemBodyRef}
                  clearButtonMode="always"
                  value={body}
                />
              </View>
              {errortext != '' ? (
                <Text style={styles.errorTextStyle}>
                  {errortext}
                </Text>
              ) : null}
              <TouchableOpacity
                style={styles.buttonStyle}
                activeOpacity={0.5}
                onPress={() => {
                  addNewItem(), clearBody()}}
                >
                <Text style={styles.buttonTextStyle}>Add Item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonStyle}
                activeOpacity={0.5}
                onPress={() => {
                  sendSMS()}}
                >
                <Text style={styles.buttonTextStyle}>Text your list</Text>
              </TouchableOpacity>
              
              {/* </KeyboardAwareScrollView> */}
              
            
            </View>
        <StatusBar style="auto" />
        </KeyboardAwareScrollView>
  </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDE0DD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,

  },
  home: {
    maxWidth: 400,
    backgroundColor :'#DDE0DD',
    position: 'relative',
    bottom: 0,
    paddingBottom: 40,

    // marginBottom: 100,
    // paddingTop: 20,
  },
  mainBody: {
    // flex: 1,
    justifyContent: 'center',
    backgroundColor: '#E7EBEF',
    alignContent: 'center',
    position: 'relative',
    bottom: 0,
    paddingTop: 20,
  },
  listItems: {
    color: '#2D608F',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingRight: 20,
    paddingLeft: 20
  },
  text: {
    position: 'relative',
    top: 100,
    paddingLeft: 20,
  },
  SectionStyle: {
    maxWidth: '100%',
    flexDirection: 'column',
    // height: 100,
    marginTop: 15,
    marginLeft: 10,
    marginRight: 10,
    margin: 10,
    // width: 400,
    color: 'black',
    borderWidth: 2,
    margin: 4,
  },
  listHeader: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    paddingLeft: 10,
  }, 
  firstRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    display: 'flex',
    paddingBottom: 5,
    paddingTop: 8,
    
  },
  description: {
    fontSize: 18,
    display: 'flex',
    paddingBottom: 5,
    paddingTop: 8,
  },
  InputStyle: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: 40,
    marginTop: 20,
    marginLeft: 37,
    marginRight: 10,
    margin: 10,
    width: 300,
    color: 'black',
  },
  buttonStyle: {
    backgroundColor: '#E7EBEF',
    borderWidth: 0,
    color: '#5B5A60',
    borderColor: '#7DE24E',
    height: 40,
    alignItems: 'center',
    borderRadius: 30,
    marginLeft: 35,
    marginRight: 35,
    marginTop: 20,
    marginBottom: 10,
  },
  buttonTextStyle: {
    color: '#1c5d8e',
    paddingVertical: 10,
    fontSize: 16,
  },
  textInputStyle: {
    flex: 1,
    justifyContent: 'center',
    color: '#0f3c68',
    paddingLeft: 15,
    paddingRight: 15,
    height: 50,
    borderWidth: 1,
    borderRadius: 30,
    borderColor: '#dadae8',
    backgroundColor: '#E7EBEF'
  },
  });
  