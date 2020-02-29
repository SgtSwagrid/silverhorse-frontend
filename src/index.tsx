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
    id: number,
    post: Post,
    album: Album,
    user: User
}

// Item props with functions for modifying the item.
interface MutableItemProps extends ItemProps {
    rename: Function,
    delete: Function
}

// Internal item state, used to track user item modification.
interface ItemState {
    selected: boolean,
    title: string,
    hover: boolean,
    mounted: boolean
}

/* Item type, featuring a post, album and user.
 * Displays each item as a row in a table.
 * Allows the user to change the post title or delete the item. */
class Item extends Component<MutableItemProps, ItemState> {

    state = {
        // When selected, an item can be modified.
        selected: false,
        // The new title.
        title: this.props.post.title,
        //Whether the cursor is currently over this item.
        hover: false,
        mounted: false
    };

    // Reference to the table row which this item occupies.
    row: RefObject<HTMLTableRowElement> = React.createRef();
    // Reference to the input box for renaming post titles.
    input: RefObject<HTMLInputElement> = React.createRef();
    // Reference to the delete button for this item.
    delete: RefObject<HTMLButtonElement> = React.createRef();

    render() {
        return (

            // Keep track of whether the cursor is over this item.
            <tr ref={this.row}
                onMouseEnter={this.onMouseEnter.bind(this)}
                onMouseLeave={this.onMouseLeave.bind(this)}>

                <td>{!this.state.selected ? this.props.post.title :
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
                        <button type="button" title="Delete" ref={this.delete}
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

        if (this.row.current != null
            && this.row.current!.contains(e.target as Node)) {

            if (this.delete.current!.contains(e.target as Node)) {
                this.props.delete();
                this.setState({ selected: false });

            } else if (!this.state.selected) {
                this.setState({ title: this.props.post.title, selected: true });
                this.input.current!.select();
            }
        } else {
            this.props.rename(this.state.title);
            this.setState({ selected: false });
        }
    }

    // Called when any key is pressed.
    onKey(e: KeyboardEvent) {

        // If enter is pressed, unselect the item and save the modification.
        if (e.code === 'Enter') {
            if (this.state.selected) {
                this.props.rename(this.state.title);
                this.setState({ selected: false });
            }

        // If escape is pressed, unselect the item and discard the modification.
        } else if (e.code === 'Escape') {
            this.setState({ selected: false, title: this.props.post.title });
        }
    }

    // Keep track of whether the cursor is over this item.
    onMouseEnter(e: React.MouseEvent) { this.setState({ hover: true }); }
    onMouseLeave(e: React.MouseEvent) { this.setState({ hover: false }); }

    // Called when the post title is modified to update the value.
    onRename(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ title: e.target.value });
    }

    // Called when an item is deleted.
    onDelete(e: React.MouseEvent) {
        e.preventDefault();
        this.props.delete();
    }

    // Enable the listeners while this component is present.
    componentDidMount() {
        this.setState({ mounted: true });
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('keydown', this.onKey.bind(this));
    }

    //Disable the listeners while this component is not present.
    componentWillUnmount() {
        document.removeEventListener('click', this.onClick.bind(this));
        document.removeEventListener('keydown', this.onKey.bind(this));
        this.setState({ mounted: false });
    }
}

interface ListProps { }
// List of items which have been generated.
interface ListState { items: Array<ItemProps> }

// Generate and display list of items in a table.
class ItemList extends Component<ListProps, ListState> {

    state = { items: [] };

    constructor(prop: ItemProps) {
        super(prop);
        // Generate some random items, and then update the state accordingly.
        this.createItems(NUM_ITEMS).then(i => this.setState({ items: i }));
    }

    render() {
        return (

            <table className='table table-hover table-striped'>
                <thead>
                    <tr>
                        <th className="col-xs-5">Post Title</th>
                        <th className="col-xs-4">Album Title</th>
                        <th className="col-xs-2">User Name</th>
                        <th className="col-xs-1"></th>
                    </tr>
                </thead>
                <tbody>
                    {(this.state.items as Array<ItemProps>).map(i => (
                        <Item id={i.id} post={i.post}
                            album={i.album} user={i.user}
                            rename={(t: string) => this.rename(i.id, t)}
                            delete={() => this.delete(i.id)} />
                        ))}
                </tbody>
            </table>
        )
    }

    // Called by child items to rename themselves.
    rename(id: number, title: string) {

        // Update state so as to incorporate the new name.
        let index = (this.state.items as Array<ItemProps>)
            .findIndex(i => i.id === id);
        let items = [...(this.state.items as Array<ItemProps>)];
        let item = { ...items[index] };
        if (item.post == null) return;
        item.post.title = title;
        items[index] = item;
        this.setState({ items: items });

        /* NOTE: Here, one would make a HTTP request to the server,
         * asking that the entry be renamed for real.
         * JSONPlaceholder's mock requests are no good here, since
         * this project uses random values from multiple tables. */
    }

    // Called by child items to delete themselves.
    delete(id: number) {

        // Update state so as to incorporate the deletion.
        let index = (this.state.items as Array<ItemProps>)
            .findIndex(i => i.id === id);
        let items = [...(this.state.items as Array<ItemProps>)]
        items.splice(index, 1);
        this.setState({ items: items });

        /* NOTE: Here, one would make a HTTP request to the server,
         * asking that the entry be deleted for real.
         * JSONPlaceholder's mock requests are no good here, since
         * this project uses random values from multiple tables. */
    }

    // Generate a series of random items.
    createItems(quantity: number) {
        return Promise.all([...Array(quantity)].map((_, id) => this.createItem(id)))
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
    createItem(id: number) {

        // Generate a random integer between min and max (inclusive).
        function random(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        // Select a random post, album and user.
        let postId = random(1, NUM_POSTS);
        let albumId = random(1, NUM_ALBUMS);
        let userId = random(1, NUM_USERS);

        // Acquire relevant information from the server.
        return Promise.all([
            fetch(URL + 'posts/' + postId).then(r => r.json()),
            fetch(URL + 'albums/' + albumId).then(r => r.json()),
            fetch(URL + 'users/' + userId).then(r => r.json())

            // Wait for the completion of all requests, and construct an 'Item'.
        ]).then(r => {
            return {
                id: id, post: r[0], album: r[1], user: r[2]
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
ReactDOM.render(<ItemList />, document.getElementById("item-list"));