import {
    StyleSheet,
    View,
    ScrollView,
    RefreshControl,
    Modal,
    TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where,
} from 'firebase/firestore';
import { Text, Chip, ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../../firebase/config';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { useSelector } from 'react-redux';

const ListScreen = ({ route, navigation }) => {
    const drivers = useSelector((state) => state.user.drivers);
    const [refreshing, setRefreshing] = useState(false);
    const [donations, setDonations] = useState([]);
    const [dateModalOpen, setDateModalOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState(null);
    const [dateSelectOpen, setDateSelectOpen] = useState(false);
    const [formattedDate, setFormattedDate] = useState('');
    const [driverFilter, setDriverFilter] = useState(null);
    const [driverFilterName, setDriverFilterName] = useState('');
    const [driverModal, setDriverModal] = useState(false);

    // grab all documents in donationForms collection from firebase
    const getAcceptedDonations = async (id = null, date = null) => {
        setRefreshing(true);
        let forms = [];
        let q, dateStart, dateEnd;
        const donations = collection(db, 'accepted');

        if (date !== null) {
            let start = new Date(date.setHours(0, 0, 0, 0));
            let end = new Date(date.setHours(23, 59, 59, 999));
            dateStart = Timestamp.fromDate(start);
            dateEnd = Timestamp.fromDate(end);
        }

        if (id === null && date === null) {
            q = query(donations, orderBy('pickup.date'));
        } else if (id !== null && date === null) {
            q = query(
                donations,
                orderBy('pickup.date'),
                where('pickup.driver', '==', id)
            );
        } else if (id === null && date !== null) {
            q = query(
                donations,
                orderBy('pickup.date'),
                where('pickup.date', '>=', dateStart),
                where('pickup.date', '<=', dateEnd)
            );
        } else {
            q = query(
                donations,
                orderBy('pickup.date'),
                where('pickup.driver', '==', id),
                where('pickup.date', '>=', dateStart),
                where('pickup.date', '<=', dateEnd)
            );
        }

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                forms.push({
                    id: doc.id,
                    data: data,
                });
            });
            setDonations(forms);
        } catch (error) {
            console.error(error);
        }

        setRefreshing(false);
    };

    const SelectDriverModal = () => {
        return (
            <Modal visible={driverModal} animationType='fade'>
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={30}
                                onPress={() => {
                                    setDriverModal(false);
                                }}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: '500',
                                marginBottom: 24,
                            }}
                        >
                            Selecciona un conductor
                        </Text>
                        {drivers.length === 0 ? (
                            <Text>No hay controladores disponibles.</Text>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#0074cb',
                                        borderRadius: 5,
                                        marginBottom: 24,
                                    }}
                                    onPress={() => {
                                        setDriverFilter(null);
                                        setDriverModal(false);
                                        getAcceptedDonations(null, dateFilter);
                                    }}
                                >
                                    <Text
                                        style={{
                                            textAlign: 'center',
                                            fontSize: 18,
                                            color: 'white',
                                            margin: 10,
                                        }}
                                    >
                                        Obtener todos controladores
                                    </Text>
                                </TouchableOpacity>
                                <ScrollView>
                                    {drivers.map((driver, idx) => {
                                        const data = driver.data;
                                        const id = driver.uid;
                                        const name = `${data.name.first} ${
                                            data.name.last1
                                        }${
                                            data.name.last2 === null
                                                ? ''
                                                : ` ${data.name.last2}`
                                        }`;

                                        return (
                                            <ListItem
                                                topDivider={idx === 0}
                                                bottomDivider
                                                key={id}
                                                onPress={() => {
                                                    setDriverFilter(id);
                                                    setDriverFilterName(name);
                                                    getAcceptedDonations(
                                                        id,
                                                        dateFilter
                                                    );
                                                    setDriverModal(false);
                                                }}
                                            >
                                                <ListItem.Content>
                                                    <ListItem.Title>
                                                        {`${data.plate} (${name})`}
                                                    </ListItem.Title>
                                                </ListItem.Content>
                                            </ListItem>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

    const DatePickerModal = () => {
        return (
            <Modal visible={dateModalOpen} animationType='fade'>
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={30}
                                onPress={() => {
                                    setDateModalOpen(false);
                                }}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: '500',
                                marginBottom: 24,
                            }}
                        >
                            Fecha de recogida
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#0074cb',
                                borderRadius: 5,
                                marginBottom: 24,
                            }}
                            onPress={() => {
                                setDateFilter(null);
                                setDateModalOpen(false);
                                getAcceptedDonations(driverFilter, null);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 18,
                                    color: 'white',
                                    margin: 10,
                                }}
                            >
                                Obtener todas fechas
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#6bb7fb',
                                borderRadius: 5,
                                marginBottom: 24,
                            }}
                            onPress={() => {
                                setDateModalOpen(false);
                                setDateSelectOpen(true);
                            }}
                        >
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 18,
                                    color: 'white',
                                    margin: 10,
                                }}
                            >
                                Seleccionar fecha especifica
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    useEffect(() => {
        if (route.params !== undefined && route.params.refresh) {
            getAcceptedDonations(driverFilter, dateFilter);
        }
    }, [route.params]);

    useEffect(() => {
        getAcceptedDonations(driverFilter, dateFilter);
    }, []);

    return (
        <>
            <SelectDriverModal />
            <DatePickerModal />
            <DateTimePicker
                isVisible={dateSelectOpen}
                mode='date'
                onConfirm={(date) => {
                    setDateSelectOpen(false);
                    setDateFilter(date);
                    setFormattedDate(date.toLocaleDateString('es-CO'));
                    getAcceptedDonations(driverFilter, date);
                }}
                onCancel={() => setDateSelectOpen(false)}
                isDarkModeEnabled={false}
            />
            <View
                style={{
                    backgroundColor: 'white',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingRight: 10,
                    borderTopColor: 'rgba(0, 0, 0, 0.15)',
                    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginVertical: 10,
                    }}
                >
                    <Chip
                        title={
                            driverFilter === null
                                ? 'Todos conductores'
                                : driverFilterName
                        }
                        icon={{
                            name: 'truck',
                            type: 'material-community',
                            size: 20,
                            color: 'white',
                        }}
                        containerStyle={{
                            paddingLeft: 10,
                        }}
                        buttonStyle={{
                            backgroundColor: '#0074cb',
                        }}
                        onPress={() => {
                            setDriverModal(true);
                        }}
                    />
                    <Chip
                        title={
                            dateFilter === null ? 'Todas fechas' : formattedDate
                        }
                        icon={{
                            name: 'calendar',
                            type: 'material-community',
                            size: 20,
                            color: 'white',
                        }}
                        containerStyle={{
                            paddingLeft: 10,
                        }}
                        buttonStyle={{
                            backgroundColor: '#0074cb',
                        }}
                        onPress={() => {
                            setDateModalOpen(true);
                        }}
                    />
                </View>
            </View>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            getAcceptedDonations(driverFilter, dateFilter);
                        }}
                    />
                }
            >
                {donations.length === 0 && !refreshing && (
                    <View style={styles.noDonations}>
                        <Text
                            style={{
                                fontWeight: '400',
                                fontSize: 24,
                                color: '#626b79',
                                textAlign: 'center',
                                width: '80%',
                            }}
                        >
                            {driverFilter === null && dateFilter === null
                                ? 'No hay donaciones que se estén recogiendo.'
                                : driverFilter === null && dateFilter !== null
                                ? `No hay donaciones que se estén recogiendo el ${formattedDate}.`
                                : driverFilter !== null && dateFilter === null
                                ? `${driverFilterName} no está recolectando donaciones.`
                                : `${driverFilterName} no está recolectando donaciones el ${formattedDate}.`}
                        </Text>
                    </View>
                )}
                <View style={styles.donations}>
                    {donations.map((pd, idx) => {
                        const data = pd.data;
                        const id = pd.id;
                        return (
                            <ListItem
                                key={id}
                                onPress={() => {
                                    navigation.push('View', {
                                        id: id,
                                        data: data,
                                    });
                                }}
                                bottomDivider
                            >
                                <ListItem.Content>
                                    <ListItem.Title>
                                        {data.org !== undefined
                                            ? data.org.name
                                            : data.indiv.name.first +
                                              ' ' +
                                              data.indiv.name.last1 +
                                              (data.indiv.name.last2 === null
                                                  ? ''
                                                  : ` ${data.indiv.name.last2}`)}
                                    </ListItem.Title>
                                    <ListItem.Content
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            width: '100%',
                                            marginTop: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                width: '50%',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Icon name='truck' size={25} />
                                            <View style={{ paddingLeft: 10 }}>
                                                <Text
                                                    style={{
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Conductor:
                                                </Text>
                                                <Text
                                                    style={{ color: '#626b79' }}
                                                >
                                                    {`${data.pickup.driverPlate}\n(${data.pickup.driverName})`}
                                                </Text>
                                            </View>
                                        </View>
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                width: '50%',
                                                alignItems: 'center',
                                                marginLeft: 12,
                                            }}
                                        >
                                            <Icon name='calendar' size={25} />
                                            <View style={{ paddingLeft: 10 }}>
                                                <Text
                                                    style={{
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Fecha:
                                                </Text>
                                                <Text
                                                    style={{ color: '#626b79' }}
                                                >
                                                    {data.pickup.date
                                                        .toDate()
                                                        .toLocaleDateString(
                                                            'es-CO'
                                                        )}
                                                </Text>
                                            </View>
                                        </View>
                                    </ListItem.Content>
                                </ListItem.Content>
                                <ListItem.Chevron />
                            </ListItem>
                        );
                    })}
                </View>
            </ScrollView>
        </>
    );
};

export default ListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 10,
        marginTop: 20,
    },
    cardText: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    donations: {
        width: '100%',
    },
    noDonations: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionSheetButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: 'white',
        padding: 15,
        margin: 15,
    },
    listItem: {
        width: '100%',
        flexDirection: 'column',
    },
    chips: {
        flex: 1,
        flexDirection: 'row',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 32,
        marginHorizontal: 32,
    },
    modalBox: {
        width: '100%',
        height: '100%',
    },
});
