import * as firebase from "firebase/app";

function toFirebaseFormat(annotation, userId) {
    const Timestamp = firebase.firestore.Timestamp
    const { startTime, endTime } = annotation
    return {
        ...annotation,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        userId
    }
}

function fromFirebaseFormat(annotation) {
    return {
        ...annotation,
        startTime: annotation.startTime.toDate(),
        endTime: annotation.endTime.toDate(),
    }
}

class AnnotationRepository {
    getAnnotations(dateRange) {
        const db = firebase.firestore()
        const userId = firebase.auth().currentUser.uid

        const annotationsRef = db.collection("annotations")

        const firebaseDateRange = dateRange.map(firebase.firestore.Timestamp.fromMillis)

        return annotationsRef
            .where('userId', '==', userId)
            .orderBy('startTime')
            .startAt(firebaseDateRange[0])
            .endAt(firebaseDateRange[1])
            .get()
            .then((querySnapshot) => {
                return querySnapshot.docs.map(doc => doc.data()).map(fromFirebaseFormat)
            })
            
    }

    saveAnnotation(annotation) {
        const db = firebase.firestore()
        const userId = firebase.auth().currentUser.uid

        const docToInsert = toFirebaseFormat(annotation, userId)
        console.log(docToInsert)
        const annotationsRef = db.collection("annotations")

        const res = annotationsRef.add(docToInsert)
            .then(function(docRef) {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch(function(error) {
                console.error("Error adding document: ", error);
            })
    }

    getTags() {}
}

const annotationRepository = new AnnotationRepository
export { annotationRepository }