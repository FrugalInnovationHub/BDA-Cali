import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import {
    getDocs,
    query,
    collection,
    where,
    Timestamp,
} from 'firebase/firestore';
import { ListItem } from 'react-native-elements';
import { useSelector } from 'react-redux';

const ListScreen = ({ route, navigation }) => {
    const id = useSelector((state) => state.user.id);

    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [pickups, setPickups] = useState([]);

    const getAssignedPickups = async () => {
        let tempPickups = [];
        let q;

        let today = new Date();
        let start = new Date(today.setHours(0, 0, 0, 0));
        let end = new Date(today.setHours(23, 59, 59, 999));
        let dateStart = Timestamp.fromDate(start);
        let dateEnd = Timestamp.fromDate(end);

        const accepted = collection(db, 'accepted');
        q = query(
            accepted,
            where('pickup.driver', '==', id),
            where('pickup.date', '>=', dateStart),
            where('pickup.date', '<=', dateEnd)
        );

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                tempPickups.push({ id: doc.id, data: doc.data() });
            });
            setPickups(tempPickups);
        } catch (error) {
            console.error(error.message);
        }
    };

    const formatAddress = (address) => {
        return `${address.street}\n${address.city}, ${address.region}`;
    };

    const formatName = (indiv) => {
        return `${indiv.name.first} ${indiv.name.last1}${
            indiv.name.last2 !== null ? ` ${indiv.name.last2}` : ''
        }`;
    };

    useEffect(() => {
        navigation.addListener('focus', () => {
            getAssignedPickups();
        });
    });

    useEffect(() => {
        setRefreshing(true);
        getAssignedPickups();
        setRefreshing(false);
    }, [refreshKey]);

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                        setRefreshKey((oldkey) => oldkey + 1);
                    }}
                />
            }
        >
            {pickups.length === 0 && (
                <View style={styles.noPickups}>
                    <Text
                        style={{
                            fontWeight: '400',
                            fontSize: 24,
                            color: '#626b79',
                        }}
                    >
                        Sin nuevas recogidas.
                    </Text>
                </View>
            )}
            {pickups.map((pickup, idx) => {
                const data = pickup.data;
                const id = pickup.id;
                const address = formatAddress(data.client.address);
                const name =
                    data.indiv !== undefined
                        ? formatName(data.indiv)
                        : data.org.name;
                return (
                    <ListItem
                        key={id}
                        onPress={() => {
                            navigation.push('View', {
                                id,
                                data,
                            });
                        }}
                        topDivider={idx === 0}
                        bottomDivider
                    >
                        <ListItem.Content>
                            <ListItem.Title>{name}</ListItem.Title>
                            <ListItem.Subtitle>{address}</ListItem.Subtitle>
                        </ListItem.Content>
                        <ListItem.Chevron />
                    </ListItem>
                );
            })}
        </ScrollView>
    );
};

export default ListScreen;

const styles = StyleSheet.create({
    noPickups: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
