from os import listdir
from os.path import isfile, join
import pinecone
import face_recognition
import json
import uuid
import hashlib
import os.path
import multiprocessing as mp

# Starting the connection with Pinecone
pinecone.init(api_key="15460131-310f-4f22-bda6-2247d0fff2dc", environment="gcp-starter")
missing_people_index = pinecone.Index("raw-missing-index")
vectors_list = []

MAX_SCORE_DISTANCE = 0.17
CHUNK_SIZE = 200
TEMP_FRAMES_DIR = "./temp_frames/"
MEDIA_DIR = "./dataset"

# Index stats
# print(missing_people_index.describe_index_stats())
# quit()

class VectorParams:
  def __init__(self, id, vector, name, file_name):
    self.id = id
    self.vector = vector
    self.name = name
    self.file_name = file_name

def main(): 
    # DB Populating fb dataset
    # populate_vectors("./dataset/fb_images/results_images_en", "social" read_json_file("./dataset/results_en.json"))
    # quit()

    scan_dir(MEDIA_DIR)


    

def scan_dir(dir_path):
    # An asynchronous solution for parallel processing using a multiprocessing pool
    pool = mp.Pool(mp.cpu_count())
    pool.map(is_media_contains_known_face, get_files_list(dir_path))

    # An alternative synchronous approach for media file iteration and known face detection
    # for mediaFilePath in get_files_list(dir_path):
    #     result = is_media_contains_known_face(mediaFilePath)

    #     if len(result) > 0:
    #         print(result)

    pool.close()

def load_batch(dir_path, source_name):

    for media_file_path in get_files_list(dir_path):
        personId = hashlib.md5(media_file_path.encode()).hexdigest()
        vectors = get_faces_vectors(media_file_path)

        print("Parsing media:" + media_file_path);

        for vector_params in vectors:
            file_name, vector = vector_params

            vectors_list.append(VectorParams(
                personId,
                vector,
                "unknown",
                file_name
            ))

            push_vectors(source_name)
            print("Vector id: " + personId) 
            print("Image: " + file_name + "\n")        

    upsert_pinecone(0, source_name)

def populate_vectors(base_dir, source_name, missing_people_json):
    for person in missing_people_json:
        try:
            if len(person["profiles"]) < 1:
                print("No profiles for: " + person["name"])
                continue
            
            profilePhotos = get_files_list(join(base_dir, person["name"]))

            for photoPath in profilePhotos:
                vectors = get_faces_vectors(photoPath)
                print(person["name"] + " " + photoPath + ", Found " + str(len(vectors)) + " vectors")
                vectors_list.extend(vectors_to_params_list(person, vectors))

                push_vectors("social")
        except Exception as err:
            print(err)
            

    
    # Just to make sure we don't miss nothing.
    upsert_pinecone(0, source_name)

def push_vectors(source): 
    total_vectors = len(vectors_list)
    print("Total collected vectors: " + str(total_vectors))

    if total_vectors > CHUNK_SIZE:
        upsert_pinecone(0, source)

def upsert_pinecone(retries, source):
    print("Pushing the vectors!")

    try:
        vectors_pinecone_list = []

        for vector_params in vectors_list:
            vectors_pinecone_list.append((
                vector_params.id,
                vector_params.vector,
                {
                    "name": vector_params.name,
                    "file_name": vector_params.file_name,
                    "source": source
                }
            ))

        upsert_response = missing_people_index.upsert(
            vectors = vectors_pinecone_list
        )

        vectors_list.clear()
        print("Pushed")

    except Exception as err:
        print(err)
        retries += 1
        if retries <= 5:
            upsert_pinecone(retries, source)

def vectors_to_params_list(person, vectors):
    for i, params in enumerate(vectors):
        file_name, vector = params

        vectors[i] = VectorParams(
            str(uuid.uuid4()),
            vector,
            person["name"],
            file_name
        )

    return vectors

def get_faces_vectors(path): 
    loaded_image = face_recognition.load_image_file(path)
    unknown_faces_encoding = face_recognition.face_encodings(loaded_image)


    for i, vector in enumerate(unknown_faces_encoding):
        unknown_faces_encoding[i] = (path, vector.tolist())

    return unknown_faces_encoding

def read_json_file(path):
    resource = open(path, "r")
    content = json.loads(resource.read())

    resource.close()
    return content

def is_media_contains_known_face(path):
    ext = os.path.splitext(path)[1]

    if(ext == ".mp4"): 
        scan_video_file(path, join(TEMP_FRAMES_DIR, hashlib.md5(path.encode()).hexdigest()))
        return

    print("Parsing " + path)

    known_faces = []

    loaded_image = face_recognition.load_image_file(path)
    unknown_faces_encoding = face_recognition.face_encodings(loaded_image)

    for unknown_face in unknown_faces_encoding:
        known_faces.extend(find_matches_in_db(unknown_face))

    if len(known_faces) > 0:
        print("Found match. " + path)
        print(known_faces)

    return known_faces

def scan_video_file(path, output_dir):
    try: 
        os.mkdir(output_dir)
        os.system("ffmpeg -i " + path + " -r 1/2 " + output_dir + "/$filename%07d.bmp  > /dev/null 2>&1")

        for mediaFilePath in get_files_list(output_dir):
            result = is_media_contains_known_face(mediaFilePath)

            if len(result) > 0:
                print(result)
    except:
        print("Failed to parse a video file: " + path)

def is_known_face(unknown_face):
    return len(find_matches_in_db(unknown_face)) > 0

def find_matches_in_db(unknown_face):
    try: 

        query_response = missing_people_index.query(
            top_k = 10,
            include_values = False,
            include_metadata = True,
            vector = unknown_face.tolist()
        )

        filtered_vectors = filter(lambda vector: vector.score < MAX_SCORE_DISTANCE, query_response.matches)

        return list(filtered_vectors)
    except:
        return []   

def get_files_list(path):
    return [join(path, f) for f in listdir(path) if isfile(join(path, f)) and f != ".DS_Store"]


if __name__ == '__main__':
    main()

