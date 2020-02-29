/* A solution for the front-end recruitment test at Silverhorse:
 * https://bitbucket.org/silverhorsetechteam/recruitment-tests/src/master/front-end.md
 * A simple CRUD application, created using TypeScript and React.
 * Written by Alec Dorrington. */

import React, { Component, RefObject } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

// The number of entries of each type available on JSONPlaceholder.
const NUM_POSTS = 100, NUM_ALBUMS = 100, NUM_USERS = 10;

// The number of fake items to generate and display.
const NUM_ITEMS = 30;

// The URL of JSONPlaceholder, the source of the fake data.
const URL = 'https://jsonplaceholder.typicode.com/';

// Item construction properties.
interface ItemProps {
    key: number,
    post: Post,
    album: Album,
    user: User
}

interface MutableItemProps extends ItemProps {
    rename: Function,
    delete: Function
}

// Internal item state, used to track user item modification.
interface ItemState {
    selected: boolean,
    title: string,
    modifiedTitle: string,
    hover: boolean
}

/* Item type, featuring a post, album and user.
 * Displays each item as a row in a table.
 * Allows the user to change the post title or delete the item. */
class Item extends Component<MutableItemProps, ItemState> {

    state = {
        // When selected, an item can be modified.
        selected: false,
        // The current title.
        title: this.props.post.title,
        // The newly modified title, yet to be saved.
        modifiedTitle: this.props.post.title,
        //Whether the cursor is currently over this item.
        hover: false
    };

    // Reference to the table row which this item occupies.
    row: RefObject<HTMLTableRowElement> = React.createRef();
    // Reference to the input box for renaming post titles.
    input: RefObject<HTMLInputElement> = React.createRef();

    render() {
        return (

            // Keep track of whether the cursor is over this item.
            <tr ref={this.row}
                onMouseEnter={this.onMouseEnter.bind(this)}
                onMouseLeave={this.onMouseLeave.bind(this)}>

                <td>{!this.state.selected ? this.state.title :
                    /* If item is selected, show input box for renaming. */ (
                        <span>
                            <input type="text" ref={this.input}
                                onChange={this.onRename.bind(this)}
                                defaultValue={this.state.title} />
                        </span>
                    )}</td>

                <td>{this.props.album.title}</td>
                <td>{this.props.user.username} </td>

                <td>
                    {!this.state.hover ? '' :
                        /* Show a delete button while the cursor is hovering. */ (
                        <button type="button" title="Delete"
                            className="btn btn-danger btn-xs" >
                            <span className="glyphicon glyphicon-remove"></span>
                        </button>
                    )}
                </td>
            </tr>
        );
    }

    // Called when the mouse is clicked, irrespective of cursor position.
    onClick(e: MouseEvent) {

        // Select this item if it was clicked, and not already selected.
        if (this.row.current!.contains(e.target as Node)) {
            if (!this.state.selected) {

                this.setState({
                    selected: true,
                    modifiedTitle: this.state.title
                });
                this.input.current!.select();
            }

            // Unselect this item if somewhere else was clicked.
        } else {
            // Update the actual title.
            if (this.state.selected) {
                this.setState({ title: this.state.modifiedTitle });
            }
            this.setState({ selected: false });
        }
    }

    // Called when any key is pressed.
    onKey(e: KeyboardEvent) {

        // If enter is pressed, unselect the item and save the modification.
        if (e.code === 'Enter') {
            if (this.state.selected) {
                this.setState({ title: this.state.modifiedTitle });
            }
            this.setState({ selected: false });

            // If escape is pressed, unselect the item and discard the modification.
        } else if (e.code === 'Escape') {
            this.setState({ selected: false });
        }
    }

    // Keep track of whether the cursor is over this item.
    onMouseEnter(e: React.MouseEvent) { this.setState({ hover: true }); }
    onMouseLeave(e: React.MouseEvent) { this.setState({ hover: false }); }

    // Called when the post title is modified to update the value.
    onRename(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ modifiedTitle: e.target.value });
    }

    // Enable the listeners while this component is present.
    componentDidMount() {
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('keydown', this.onKey.bind(this));
    }

    //Disable the listeners while this component is not present.
    componentWillUnmount() {
        document.removeEventListener('click', this.onClick.bind(this));
        document.removeEventListener('keydown', this.onKey.bind(this));
    }
}

// The ItemList accepts an array of item objects to show.
interface ListProps { items: Array<ItemProps> }

// List of items, displayed as a table.
class ItemList extends Component<ListProps> {

    render() {
        return (

            <table className='table table-hover'>
                <thead>
                    <tr>
                        <th>Post Title</th>
                        <th>Album Title</th>
                        <th>User Name</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.items.map(i => (
                        <Item key={i.key} post={i.post}
                            album={i.album} user={i.user}
                            rename={this.rename} delete={this.delete} />
                    ))}
                </tbody>
            </table>
        )
    }

    rename(key: number, title: string) {

    }

    delete(key: number) {

    }
}

interface AppProps { }
// List of items which have been generated.
interface AppState { items: Array<ItemProps> }

/* Top-level component for generating random items.
 * Delegates to ItemList to display the items in a table. */
class CrudApp extends Component<AppProps, AppState> {

    state = { items: [] };

    constructor(prop: AppProps) {
        super(prop);
        // Generate some random items, and then update the state accordingly.
        this.createItems(NUM_ITEMS).then(i => this.setState({ items: i }));
    }

    render() {
        // Render a list of all items.
        return (<ItemList items={this.state.items} />);
    }

    // Generate a series of random items.
    createItems(quantity: number) {
        return Promise.all([...Array(quantity)].map((_, i) => this.createItem(i)))
    }

    /* Generate a new item using random values from JSONPlaceholder.
     * 
     * NOTE 1: The user ID won't necessarily match across all 3 parts,
     * although this could easily be accomplished by asking the server
     * to filter based on user ID before selecting the random items.
     * 
     * NOTE 2: Since the values are chosen at random, there is nothing
     * to prevent repeated values. This can be solved by first getting a list
     * of all values, and removing values from the list as they are chosen. */
    createItem(key: number) {

        // Generate a random integer between min and max (inclusive).
        function random(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        // Select a random post, album and user.
        var postId = random(1, NUM_POSTS);
        var albumId = random(1, NUM_ALBUMS);
        var userId = random(1, NUM_USERS);

        // Acquire relevant information from the server.
        return Promise.all([
            fetch(URL + 'posts/' + postId).then(r => r.json()),
            fetch(URL + 'albums/' + albumId).then(r => r.json()),
            fetch(URL + 'users/' + userId).then(r => r.json())

            // Wait for the completion of all requests, and construct an 'Item'.
        ]).then(r => {
            return {
                key: key, post: r[0], album: r[1], user: r[2]
            }
        });
    }
}

// Post type with equivalent structure to that of JSONPlaceholder.
interface Post {
    userId: number,
    id: number,
    title: string,
    body: string
}

// Album type with equivalent structure to that of JSONPlaceholder.
interface Album {
    userId: number,
    id: number,
    title: string
}

// User type with equivalent structure to that of JSONPlaceholder.
interface User {
    id: number,
    name: string,
    username: string,
    email: string,
    address: {
        street: string,
        suite: string,
        city: string,
        zipcode: string,
        geo: {
            lat: string,
            long: string
        }
    },
    phone: string,
    website: string,
    company: {
        name: string,
        catchPhrase: string,
        bs: string
    }
}

// Script entry point; generate and display a list of random items.
ReactDOM.render(<CrudApp />, document.getElementById("item-list"));