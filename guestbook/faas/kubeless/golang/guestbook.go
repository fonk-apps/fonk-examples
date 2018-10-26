package kubeless

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/kubeless/kubeless/pkg/functions"
	mgo "gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
)

/*
type JSONTime int64

func (t JSONTime) MarshalJSON() ([]byte, error) {
	stamp := fmt.Sprintf("%s", time.Unix(int64(t)).Format("Mon Jan 2"))
	return []byte(stamp), nil
}
*/

type Entry struct {
	Id        bson.ObjectId `bson:"_id,omitempty" json:"_id,omitempty"`
	Text      string        `json:"text"`
	UpdatedAt time.Time     `json:"updatedAt,omitempty" bson:"updatedAt,omitempty"`
}

func dialMongo() (*mgo.Session, error) {
	session, err := mgo.Dial("fonkdb-mongodb.default:27017")
	return session, err
}

// function to create a new entry.
func Create(event functions.Event, context functions.Context) (string, error) {
	return event.Data, nil
	var e Entry
	err := json.Unmarshal([]byte(event.Data), &e)
	if err != nil {
		return "", err
	}
	e.Id = bson.NewObjectIdWithTime(time.Now())
	e.UpdatedAt = time.Now()
	session, err := dialMongo()
	if err != nil {
		return "", err
	}
	collection := session.DB("guestbook_app").C("entries")
	fmt.Println("Inserting...")
	fmt.Println(e)
	err = collection.Insert(e)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(e)
	return string(b), err
}

// function to list the guestbook
func List(event functions.Event, context functions.Context) (string, error) {
	session, err := dialMongo()
	if err != nil {
		return "", err
	}
	collection := session.DB("guestbook_app").C("entries")
	var entries []Entry
	err = collection.Find(nil).All(&entries)
	if err != nil {
		return "", err
	}
	lc := map[string][]Entry{"entries": entries}
	b, err := json.Marshal(lc)
	return string(b), err
}
