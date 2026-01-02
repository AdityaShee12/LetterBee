import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { AiOutlineCamera, AiOutlineClose } from "react-icons/ai";
import { BACKEND_API } from "../Backend_API.js";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { IoIosArrowBack } from "react-icons/io";
import socket from "../socket.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const StatusUpload = () => {
  const [statuses, setStatuses] = useState([]);
  const [userStatus, setUserStatus] = useState([]);
  const [userLastFile, setUserLastFile] = useState(null);
  const [friendStatus, setFriendStatus] = useState(true);
  const [friendLastFile, setFriendLastFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userId, userName } = useSelector((state) => state.user);
  const [userStatusCount, setUserStatusCount] = useState(false);
  const [friendStatusCount, setFriendStatusCount] = useState(false);
  const [statusCount, setStatusCount] = useState(false);
  const fileInputRef = useRef(null);
  const [selectUserStatus, setSelectUserStatus] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoom1, setZoom1] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [file, setFile] = useState(null);
  const currentFile =
    selectedFiles && selectedFiles.length > 0
      ? selectedFiles[currentIndex]
      : null;
  const videoRef = useRef();
  const [isVideo, setIsVideo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);

  const [trimmedBlob, setTrimmedBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [frames, setFrames] = useState([]);
  const ffmpeg = new FFmpeg();

  useEffect(() => {
    console.log(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    // cleanup যাতে memory leak না হয়
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));

    if (selected.type.startsWith("video/")) {
      setIsVideo(true);
      setFrames([]);
      setTrimmedBlob(null);
    } else {
      setIsVideo(false);
    }
  };

  /* ================= FRAME EXTRACTION ================= */
  const extractFrames = async (url, videoDuration) => {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const thumbs = [];

    for (let t = 0; t < videoDuration; t += 1) {
      await new Promise((res) => {
        video.currentTime = t;
        video.onseeked = res;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      thumbs.push(canvas.toDataURL("image/jpeg"));
    }

    setFrames(thumbs);
  };

  /* ================= TRIM VIDEO ================= */
  const handleTrim = async () => {
    if (!file) return;
    setLoading(true);
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js",
      });
    }
    await ffmpeg.writeFile("input.mp4", await fetchFile(file));

    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-ss",
      `${start}`,
      "-to",
      `${end}`,
      "-c",
      "copy",
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    const blob = new Blob([data.buffer], { type: "video/mp4" });

    setTrimmedBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setLoading(false);
  };

  /* ================= UPLOAD ================= */
  const handleUpload = async () => {
    const uploadFile = isVideo ? trimmedBlob : file;
    if (!uploadFile) return alert("Trim video first");

    const formData = new FormData();
    formData.append("status", uploadFile);
    formData.append("userId", userId);
    formData.append("userName", userName);

    try {
      const res = await axios.post(
        `${BACKEND_API}/api/v1/users/status`,
        formData,
        { withCredentials: true }
      );

      if (res.data?.data) socket.emit("statusUpdate", userId);

      setFile(null);
      setPreviewUrl(null);
      setFrames([]);
      setTrimmedBlob(null);
    } catch (err) {
      alert("Upload failed");
      console.error(err);
    }
  };

  // User's status
  useEffect(() => {
    if (userStatus && userStatus.length > 0) {
      const lastStatus = userStatus[userStatus.length - 1];
      if (lastStatus) {
        setUserStatusCount(true);
        setUserLastFile(lastStatus);
      }
    } else {
      setUserStatusCount(false);
      setUserLastFile(null);
    }
  }, [userStatus]);

  // Friend's status
  useEffect(() => {
    if (statuses) {
      setFriendStatusCount(true);
    }
  }, [statuses]);

  // fetch user and friend's status
  useEffect(() => {
    const statusShow = async () => {
      try {
        const response = await axios.post(
          `${BACKEND_API}/api/v1/users/statusShow`,
          {
            userId,
          }
        );
        const data = response;
        if (data) {
          console.log("Status_data", data.data.data);
          setUserStatus(data.data.data.usersData || []);
          setStatuses(data.data.data.friendsData || []);
        }
      } catch (error) {
        console.log("Error", error);
      }
    };
    statusShow();
  }, [userId]);

  // IMAGE STATUS AUTO TIMER (Friend status list)
  useEffect(() => {
    let timer;
    if (zoom1 && selectedFiles && selectedFiles[currentIndex]) {
      timer = setTimeout(() => {
        if (currentIndex === selectedFiles.length - 1) {
          setZoom1(false);
          setSelectedFiles(null);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [zoom1, currentIndex, selectedFiles]);

  // VIDEO STATUS AUTO TIMER (Friend status list)
  useEffect(() => {
    let timer;
    if (
      zoom1 &&
      selectedFiles &&
      (selectedFiles[currentIndex]?.endsWith(".mp4") ||
        selectedFiles[currentIndex]?.includes("video"))
    ) {
      timer = setTimeout(() => {
        if (currentIndex === selectedFiles.length - 1) {
          setZoom1(false);
          setSelectedFiles(null);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [zoom1, currentIndex, selectedFiles]);

  // IMAGE STATUS AUTO TIMER (USER status list)
  useEffect(() => {
    let timer;
    if (
      zoom &&
      selectedFile &&
      !selectedFile?.endsWith(".mp4") &&
      !selectedFile?.includes("video")
    ) {
      timer = setTimeout(() => {
        setZoom(false);
        setSelectedFile(null);
      }, 5000);
    }
    return () => clearTimeout(timer); // cleanup
  }, [zoom, selectedFile]);

  // VIDEO STATUS AUTO TIMER (USER status list)
  useEffect(() => {
    let timer;
    if (
      zoom &&
      selectedFile &&
      (selectedFile?.endsWith(".mp4") || selectedFile?.includes("video"))
    ) {
      timer = setTimeout(() => {
        setZoom(false);
        setSelectedFile(null);
      }, 10000);
    }
    return () => clearTimeout(timer); // cleanup
  }, [zoom, selectedFile]);

  return (
    <div className="mt-4 px-4 pt-[3rem] lg:pl-[4rem]">
      {/* Modal for preview */}
      {/* If atleast one status uploaded by user */}
      <div className="flex gap-3">
        <div>
          {userStatusCount ? (
            <div className="flex">
              {/* if zoom or multiple status available or show only last status*/}
              {selectUserStatus ? (
                <div>
                  {/* If zoom or multiple status available then below code will execute */}
                  {zoom && selectedFile ? (
                    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
                      <div className="relative max-w-full max-h-full">
                        {selectedFile?.endsWith(".mp4") ||
                        selectedFile?.includes("video") ? (
                          <TransformWrapper
                            initialScale={1}
                            wheel={{ step: 0.1 }}
                            pinch={{ step: 5 }}
                            doubleClick={{ disabled: true }}>
                            {" "}
                            <TransformComponent>
                              <video
                                src={selectedFile}
                                className="max-w-full max-h-screen object-contain"
                                autoPlay
                                muted
                              />
                            </TransformComponent>{" "}
                          </TransformWrapper>
                        ) : (
                          <div className="cursor-grab">
                            {" "}
                            <TransformWrapper
                              initialScale={1}
                              wheel={{ step: 0.1 }}
                              pinch={{ step: 5 }}>
                              {" "}
                              <TransformComponent>
                                <img
                                  src={selectedFile}
                                  alt="status"
                                  className="max-w-full max-h-screen object-contain"
                                />
                              </TransformComponent>
                            </TransformWrapper>
                          </div>
                        )}
                        <button
                          className="absolute top-2 right-2 text-white text-xl"
                          onClick={() => {
                            setZoom(false);
                            setSelectedFile(null);
                          }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {" "}
                      <div className="flex gap-4">
                        <label
                          htmlFor="status"
                          className="w-[3.5rem] h-[3.5rem] rounded-full bg-slate-200 overflow-hidden cursor-pointer flex items-center justify-center">
                          {previewUrl ? (
                            file.type.startsWith("video/") ? (
                              <video
                                src={previewUrl}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={previewUrl}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            "+"
                          )}
                          <input
                            type="file"
                            id="status"
                            accept="image/,video/"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {file && (
                          <div
                            className="w-20 h-7 rounded-lg mt-[0.7rem] ml-[0.3rem] text-green-600 text-xl cursor-pointer flex items-center justify-center"
                            onClick={handleUpload}>
                            Upload
                          </div>
                        )}
                      </div>
                      {userStatus?.length > 0 && (
                        <div className="flex flex-col gap-3">
                          {userStatus?.map((file, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                setZoom(true);
                                setSelectedFile(file);
                                setFriendStatus(false);
                              }}>
                              {file.endsWith(".mp4") ||
                              file.includes("video") ? (
                                <video
                                  src={file}
                                  controls
                                  autoPlay
                                  className="w-[3.5rem] h-[3.5rem] rounded-full cursor-pointer"
                                />
                              ) : (
                                <img
                                  src={file}
                                  alt=""
                                  className="w-[3.5rem] h-[3.5rem] rounded-full cursor-pointer"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // last status which uploaded by user
                <div
                  className="w-14 h-14 rounded-full border-2 border-green-500 overflow-hidden cursor-pointer"
                  onClick={() => setSelectUserStatus(true)}>
                  {userLastFile &&
                    (userLastFile?.endsWith(".mp4") ||
                    userLastFile?.includes("video") ? (
                      <video
                        src={userLastFile}
                        className="w-full h-full object-cover"
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={userLastFile}
                        alt="status"
                        className="w-full h-full object-cover"
                      />
                    ))}
                </div>
              )}
            </div>
          ) : (
            // If no status uploaded by user
            <div className="flex gap-4">
              <label
                htmlFor="status"
                className="w-[3.5rem] h-[3.5rem] rounded-full bg-slate-200 overflow-hidden cursor-pointer flex items-center justify-center">
                {previewUrl ? (
                  file.type.startsWith("video/") ? (
                    <video
                      src={previewUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  "+"
                )}
                <input
                  type="file"
                  id="status"
                  accept="image/,video/"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div
                  className="w-20 h-7 rounded-lg mt-[0.7rem] ml-[0.3rem] text-green-600 text-xl cursor-pointer flex items-center justify-center"
                  onClick={handleUpload}>
                  Upload
                </div>
              )}
            </div>
          )}
        </div>
        <div className="my-3 text-xl font-mono">My Status</div>
      </div>
      {/* Recent updates */}
      {/* Friend round icons */}
      {friendStatus && (
        <div>
          {/* Friend status modal */}
          <div className="my-4 text-2xl font-mono">Friend's status</div>
          {zoom1 && selectedFiles?.length > 0 && selectedFiles[currentIndex] ? (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
              <div className="relative max-w-full max-h-full">
                {selectedFiles[currentIndex]?.endsWith(".mp4") ||
                selectedFiles[currentIndex]?.includes("video") ? (
                  <div className="cursor-grab">
                    {" "}
                    <TransformWrapper
                      initialScale={1}
                      wheel={{ step: 0.1 }}
                      pinch={{ step: 5 }}>
                      {" "}
                      <TransformComponent>
                        {" "}
                        <video
                          src={selectedFiles[currentIndex]}
                          className="max-w-full max-h-screen object-contain"
                          controls
                          autoPlay
                          muted
                        />{" "}
                      </TransformComponent>
                    </TransformWrapper>
                  </div>
                ) : (
                  <div className="cursor-grab">
                    {" "}
                    <TransformWrapper
                      initialScale={1}
                      wheel={{ step: 0.1 }}
                      pinch={{ step: 5 }}>
                      {" "}
                      <TransformComponent>
                        {" "}
                        <img
                          src={selectedFiles[currentIndex]}
                          alt="status"
                          className="max-w-full max-h-screen object-contain"
                        />{" "}
                      </TransformComponent>
                    </TransformWrapper>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 text-white text-xl"
                  onClick={() => {
                    setZoom1(false);
                    setSelectedFiles(null);
                  }}>
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="gap-4 mt-4">
              {statuses?.length > 0 && (
                <div className="flex flex-col gap-3">
                  {statuses.map((status, index) => {
                    const lastFile =
                      status?.statuses?.[status?.statuses?.length - 1];
                    return lastFile ? (
                      <div key={index} className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-full border-2 border-green-500 overflow-hidden cursor-pointer"
                          onClick={() => {
                            setZoom1(true);
                            setSelectedFiles(status?.statuses);
                            setCurrentIndex(0);
                          }}>
                          {lastFile?.endsWith(".mp4") ||
                          lastFile?.includes("video") ? (
                            <video
                              src={lastFile}
                              className="w-full h-full object-cover"
                              muted
                              loop
                            />
                          ) : (
                            <img
                              src={lastFile}
                              alt="status"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="my-2 text-xl font-mono">
                          {status?.friendName}
                        </div>
                      </div>
                    ) : (
                      <div className="text-lg">
                        No friend's status available
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusUpload;

// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { AiOutlineCamera, AiOutlineClose } from "react-icons/ai";
// import { BACKEND_API } from "../Backend_API.js";
// import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
// import { IoIosArrowBack } from "react-icons/io";
// import socket from "../socket.js";

// const StatusUpload = () => {
//   const [statuses, setStatuses] = useState([]);
//   const [userStatus, setUserStatus] = useState([]);
//   const [userLastFile, setUserLastFile] = useState(null);
//   const [friendStatus, setFriendStatus] = useState(true);
//   const [friendLastFile, setFriendLastFile] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const { userId, userName } = useSelector((state) => state.user);
//   const [userStatusCount, setUserStatusCount] = useState(false);
//   const [friendStatusCount, setFriendStatusCount] = useState(false);
//   const [statusCount, setStatusCount] = useState(false);
//   const fileInputRef = useRef(null);
//   const [selectUserStatus, setSelectUserStatus] = useState(false);
//   const [zoom, setZoom] = useState(false);
//   const [zoom1, setZoom1] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [file, setFile] = useState(null);
//   const currentFile =
//     selectedFiles && selectedFiles.length > 0
//       ? selectedFiles[currentIndex]
//       : null;

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//       const objectUrl = URL.createObjectURL(selectedFile);
//       setPreviewUrl(objectUrl);
//     }
//   };

//   useEffect(() => {
//     console.log(previewUrl);
//   }, [previewUrl]);

//   useEffect(() => {
//     // cleanup যাতে memory leak না হয়
//     return () => {
//       if (previewUrl) {
//         URL.revokeObjectURL(previewUrl);
//       }
//     };
//   }, [previewUrl]);

//   const handleUpload = async () => {
//     if (!file) return alert("Please select a file first");
//     console.log("FD", userName);

//     const formData = new FormData();
//     formData.append("status", file);
//     formData.append("userId", userId);
//     formData.append("userName", userName);
//     try {
//       const response = await axios.post(
//         `${BACKEND_API}/api/v1/users/status`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//           withCredentials: true,
//         }
//       );
//       setUserStatus(response.data.data);
//       console.log("SD", response);
//       setPreviewUrl(null);
//       if (response.data.data) socket.emit("statusUpdate", userId);
//     } catch (err) {
//       console.error("Upload failed:", err);
//       alert("Upload failed");
//     }
//   };

//   // User's status
//   useEffect(() => {
//     if (userStatus && userStatus.length > 0) {
//       const lastStatus = userStatus[userStatus.length - 1];
//       if (lastStatus) {
//         setUserStatusCount(true);
//         setUserLastFile(lastStatus);
//       }
//     } else {
//       setUserStatusCount(false);
//       setUserLastFile(null);
//     }
//   }, [userStatus]);

//   // Friend's status
//   useEffect(() => {
//     if (statuses) {
//       setFriendStatusCount(true);
//     }
//   }, [statuses]);

//   // fetch user and friend's status
//   useEffect(() => {
//     const statusShow = async () => {
//       try {
//         const response = await axios.post(
//           `${BACKEND_API}/api/v1/users/statusShow`,
//           {
//             userId,
//           }
//         );
//         const data = response;
//         if (data) {
//           console.log("Status_data", data.data.data);
//           setUserStatus(data.data.data.usersData || []);
//           setStatuses(data.data.data.friendsData || []);
//         }
//       } catch (error) {
//         console.log("Error", error);
//       }
//     };
//     statusShow();
//   }, [userId]);

//   // IMAGE STATUS AUTO TIMER (Friend status list)
//   useEffect(() => {
//     let timer;
//     if (zoom1 && selectedFiles && selectedFiles[currentIndex]) {
//       timer = setTimeout(() => {
//         if (currentIndex === selectedFiles.length - 1) {
//           setZoom1(false);
//           setSelectedFiles(null);
//         } else {
//           setCurrentIndex((prev) => prev + 1);
//         }
//       }, 5000);
//     }
//     return () => clearTimeout(timer);
//   }, [zoom1, currentIndex, selectedFiles]);

//   // VIDEO STATUS AUTO TIMER (Friend status list)
//   useEffect(() => {
//     let timer;
//     if (
//       zoom1 &&
//       selectedFiles &&
//       (selectedFiles[currentIndex]?.endsWith(".mp4") ||
//         selectedFiles[currentIndex]?.includes("video"))
//     ) {
//       timer = setTimeout(() => {
//         if (currentIndex === selectedFiles.length - 1) {
//           setZoom1(false);
//           setSelectedFiles(null);
//         } else {
//           setCurrentIndex((prev) => prev + 1);
//         }
//       }, 10000);
//     }
//     return () => clearTimeout(timer);
//   }, [zoom1, currentIndex, selectedFiles]);

//   // IMAGE STATUS AUTO TIMER (USER status list)
//   useEffect(() => {
//     let timer;
//     if (
//       zoom &&
//       selectedFile &&
//       !selectedFile?.endsWith(".mp4") &&
//       !selectedFile?.includes("video")
//     ) {
//       timer = setTimeout(() => {
//         setZoom(false);
//         setSelectedFile(null);
//       }, 5000);
//     }
//     return () => clearTimeout(timer); // cleanup
//   }, [zoom, selectedFile]);

//   // VIDEO STATUS AUTO TIMER (USER status list)
//   useEffect(() => {
//     let timer;
//     if (
//       zoom &&
//       selectedFile &&
//       (selectedFile?.endsWith(".mp4") || selectedFile?.includes("video"))
//     ) {
//       timer = setTimeout(() => {
//         setZoom(false);
//         setSelectedFile(null);
//       }, 10000);
//     }
//     return () => clearTimeout(timer); // cleanup
//   }, [zoom, selectedFile]);

//   return (
//     <div className="mt-4 px-4 pt-[3rem] pl-[4rem]">
//       {/* Modal for preview */}
//       {/* If atleast one status uploaded by user */}
//       <div className="flex gap-3">
//         <div>
//           {userStatusCount ? (
//             <div className="flex">
//               {/* if zoom or multiple status available or show only last status*/}
//               {selectUserStatus ? (
//                 <div>
//                   {/* If zoom or multiple status available then below code will execute */}
//                   {zoom && selectedFile ? (
//                     <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
//                       <div className="relative max-w-full max-h-full">
//                         {selectedFile?.endsWith(".mp4") ||
//                         selectedFile?.includes("video") ? (
//                           <TransformWrapper
//                             initialScale={1}
//                             wheel={{ step: 0.1 }}
//                             pinch={{ step: 5 }}
//                             doubleClick={{ disabled: true }}>
//                             {" "}
//                             <TransformComponent>
//                               <video
//                                 src={selectedFile}
//                                 className="max-w-full max-h-screen object-contain"
//                                 autoPlay
//                                 muted
//                               />
//                             </TransformComponent>{" "}
//                           </TransformWrapper>
//                         ) : (
//                           <div className="cursor-grab">
//                             {" "}
//                             <TransformWrapper
//                               initialScale={1}
//                               wheel={{ step: 0.1 }}
//                               pinch={{ step: 5 }}>
//                               {" "}
//                               <TransformComponent>
//                                 <img
//                                   src={selectedFile}
//                                   alt="status"
//                                   className="max-w-full max-h-screen object-contain"
//                                 />
//                               </TransformComponent>
//                             </TransformWrapper>
//                           </div>
//                         )}
//                         <button
//                           className="absolute top-2 right-2 text-white text-xl"
//                           onClick={() => {
//                             setZoom(false);
//                             setSelectedFile(null);
//                           }}>
//                           ✕
//                         </button>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="flex flex-col gap-5">
//                       {" "}
//                       <div className="flex gap-4">
//                         <label
//                           htmlFor="status"
//                           className="w-[3.5rem] h-[3.5rem] rounded-full bg-slate-200 overflow-hidden cursor-pointer flex items-center justify-center">
//                           {previewUrl ? (
//                             file.type.startsWith("video/") ? (
//                               <video
//                                 src={previewUrl}
//                                 className="w-full h-full object-cover"
//                               />
//                             ) : (
//                               <img
//                                 src={previewUrl}
//                                 alt="preview"
//                                 className="w-full h-full object-cover"
//                               />
//                             )
//                           ) : (
//                             "+"
//                           )}
//                           <input
//                             type="file"
//                             id="status"
//                             accept="image/,video/"
//                             ref={fileInputRef}
//                             onChange={handleFileChange}
//                             className="hidden"
//                           />
//                         </label>
//                         {file && (
//                           <div
//                             className="w-20 h-7 rounded-lg mt-[0.7rem] ml-[0.3rem] text-green-600 text-xl cursor-pointer flex items-center justify-center"
//                             onClick={handleUpload}>
//                             Upload
//                           </div>
//                         )}
//                       </div>
//                       {userStatus?.length > 0 && (
//                         <div className="flex flex-col gap-3">
//                           {userStatus?.map((file, index) => (
//                             <div
//                               key={index}
//                               onClick={() => {
//                                 setZoom(true);
//                                 setSelectedFile(file);
//                                 setFriendStatus(false);
//                               }}>
//                               {file.endsWith(".mp4") ||
//                               file.includes("video") ? (
//                                 <video
//                                   src={file}
//                                   controls
//                                   autoPlay
//                                   className="w-[3.5rem] h-[3.5rem] rounded-full cursor-pointer"
//                                 />
//                               ) : (
//                                 <img
//                                   src={file}
//                                   alt=""
//                                   className="w-[3.5rem] h-[3.5rem] rounded-full cursor-pointer"
//                                 />
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 // last status which uploaded by user
//                 <div
//                   className="w-14 h-14 rounded-full border-2 border-green-500 overflow-hidden cursor-pointer"
//                   onClick={() => setSelectUserStatus(true)}>
//                   {userLastFile &&
//                     (userLastFile?.endsWith(".mp4") ||
//                     userLastFile?.includes("video") ? (
//                       <video
//                         src={userLastFile}
//                         className="w-full h-full object-cover"
//                         muted
//                         loop
//                       />
//                     ) : (
//                       <img
//                         src={userLastFile}
//                         alt="status"
//                         className="w-full h-full object-cover"
//                       />
//                     ))}
//                 </div>
//               )}
//             </div>
//           ) : (
//             // If no status uploaded by user
//             <div className="flex gap-4">
//               <label
//                 htmlFor="status"
//                 className="w-[3.5rem] h-[3.5rem] rounded-full bg-slate-200 overflow-hidden cursor-pointer flex items-center justify-center">
//                 {previewUrl ? (
//                   file.type.startsWith("video/") ? (
//                     <video
//                       src={previewUrl}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <img
//                       src={previewUrl}
//                       alt="preview"
//                       className="w-full h-full object-cover"
//                     />
//                   )
//                 ) : (
//                   "+"
//                 )}
//                 <input
//                   type="file"
//                   id="status"
//                   accept="image/,video/"
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                   className="hidden"
//                 />
//               </label>
//               {file && (
//                 <div
//                   className="w-20 h-7 rounded-lg mt-[0.7rem] ml-[0.3rem] text-green-600 text-xl cursor-pointer flex items-center justify-center"
//                   onClick={handleUpload}>
//                   Upload
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//         <div className="my-3 text-xl font-mono">My Status</div>
//       </div>
//       {/* Recent updates */}
//       {/* Friend round icons */}
//       {friendStatus && (
//         <div>
//           <div className="my-4 text-2xl font-mono">Friend's status</div>
//           {/* FULLSCREEN STATUS VIEW */}
//           {zoom1 && selectedFiles?.length > 0 ? (
//             <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
//               <div className="relative max-w-full max-h-full">
//                 {/* VIDEO STATUS */}
//                 {selectedFiles[currentIndex]?.endsWith(".mp4") ||
//                 selectedFiles[currentIndex]?.includes("video") ? (
//                   <TransformWrapper initialScale={1} wheel={{ step: 0.1 }}>
//                     <TransformComponent>
//                       <video
//                         src={selectedFiles[currentIndex]}
//                         className="max-w-full max-h-screen object-contain"
//                         autoPlay
//                         controls
//                       />
//                     </TransformComponent>
//                   </TransformWrapper>
//                 ) : (
//                   /* IMAGE STATUS */
//                   <TransformWrapper initialScale={1} wheel={{ step: 0.1 }}>
//                     <TransformComponent>
//                       <img
//                         src={selectedFiles[currentIndex]}
//                         className="max-w-full max-h-screen object-contain"
//                       />
//                     </TransformComponent>
//                   </TransformWrapper>
//                 )}

//                 {/* CLOSE BUTTON */}
//                 <button
//                   className="absolute top-2 right-2 text-white text-xl"
//                   onClick={() => {
//                     setZoom1(false);
//                     setSelectedFiles(null);
//                   }}>
//                   ✕
//                 </button>
//               </div>
//             </div>
//           ) : (
//             /* STATUS LIST VIEW */
//             <div className="gap-4 mt-4">
//               {statuses?.map((status, index) => {
//                 const lastFile =
//                   status?.statuses?.[status?.statuses?.length - 1];
//                 return (
//                   <div key={index} className="flex items-center gap-3">
//                     <div
//                       className="w-14 h-14 rounded-full border-2 border-green-500 overflow-hidden cursor-pointer"
//                       onClick={() => {
//                         setZoom1(true);
//                         setSelectedFiles(status?.statuses);
//                         setCurrentIndex(0);
//                       }}>
//                       {/* VIDEO THUMBNAIL */}
//                       {lastFile?.endsWith(".mp4") ||
//                       lastFile?.includes("video") ? (
//                         <div className="relative w-full h-full">
//                           <video
//                             src={lastFile}
//                             className="w-full h-full object-cover"
//                             muted
//                             preload="metadata"
//                           />
//                           <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-lg">
//                             ▶
//                           </div>
//                         </div>
//                       ) : (
//                         /* IMAGE THUMBNAIL */
//                         <img
//                           src={lastFile}
//                           className="w-full h-full object-cover"
//                         />
//                       )}
//                     </div>
//                     <div className="text-xl font-mono">
//                       {status?.friendName}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default StatusUpload;
